/**
 * Resumable multipart uploader.
 *
 * File bytes go straight from the browser to object storage using presigned
 * URLs — they never pass through the API. The API only mints signatures and
 * records state.
 *
 * No React here on purpose: this is plain JS driving XHR, so it can be reused by
 * a CLI or the Phase 2 SDK. The UI subscribes through onProgress.
 */

const CONCURRENCY = 4
const SIGN_BATCH = 8
const MAX_PART_RETRIES = 5

/** Rolling-window speed estimate — a cumulative average lags far too much to be useful. */
class SpeedMeter {
  constructor(windowMs = 8000) {
    this.windowMs = windowMs
    this.samples = []
  }

  record(bytes) {
    const now = performance.now()
    this.samples.push({ t: now, bytes })
    const cutoff = now - this.windowMs
    while (this.samples.length && this.samples[0].t < cutoff) this.samples.shift()
  }

  /** Bytes per second, or 0 until there is enough of a window to be meaningful. */
  get bytesPerSecond() {
    if (this.samples.length < 2) return 0
    const span = (this.samples.at(-1).t - this.samples[0].t) / 1000
    if (span <= 0) return 0
    const total = this.samples.reduce((sum, s) => sum + s.bytes, 0)
    return total / span
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * PUT one part via XHR.
 *
 * fetch() cannot report upload progress, which is the entire point here, so XHR
 * stays. Resolves with the ETag the storage layer assigns — that value is
 * required to complete the upload.
 */
function putPart({ url, blob, onChunk, signal }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    let lastLoaded = 0

    xhr.open('PUT', url, true)

    xhr.upload.onprogress = (e) => {
      onChunk?.(e.loaded - lastLoaded)
      lastLoaded = e.loaded
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader('ETag')
        if (!etag) {
          // Almost always a CORS problem: the storage bucket must expose ETag
          // or the browser hides it and the upload cannot be completed.
          reject(new Error('Storage did not return an ETag (check bucket CORS ExposeHeaders).'))
          return
        }
        resolve(etag)
      } else {
        reject(new Error(`Part upload failed with status ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error('Network error during part upload'))
    xhr.onabort = () => reject(Object.assign(new Error('aborted'), { aborted: true }))
    xhr.ontimeout = () => reject(new Error('Part upload timed out'))

    signal?.addEventListener('abort', () => xhr.abort(), { once: true })
    xhr.send(blob)
  })
}

/**
 * @param {object}   opts
 * @param {File}     opts.file
 * @param {string}   opts.videoId
 * @param {number}   opts.partSize
 * @param {Array}    [opts.existingParts]  From GET /parts — these are skipped.
 * @param {Function} opts.signParts        (partNumbers[]) => Promise<{[n]: url}>
 * @param {Function} opts.onProgress       ({ uploaded, total, percent, bytesPerSecond, etaSeconds })
 * @param {AbortSignal} [opts.signal]
 * @param {() => boolean} [opts.isPaused]
 * @returns {Promise<Array<{PartNumber, ETag}>>}
 */
export async function uploadFileInParts({
  file,
  partSize,
  existingParts = [],
  signParts,
  onProgress,
  signal,
  isPaused = () => false,
}) {
  const totalParts = Math.ceil(file.size / partSize)

  // Parts already stored count as done — this is what makes a resumed upload
  // pick up where it stopped instead of starting over.
  const completed = new Map(existingParts.map((p) => [p.PartNumber, p.ETag]))
  let uploaded = existingParts.reduce((sum, p) => sum + (p.Size ?? 0), 0)

  const meter = new SpeedMeter()
  const pending = []
  for (let n = 1; n <= totalParts; n++) if (!completed.has(n)) pending.push(n)

  const report = () => {
    const bps = meter.bytesPerSecond
    onProgress?.({
      uploaded,
      total: file.size,
      percent: file.size ? Math.min(100, (uploaded / file.size) * 100) : 0,
      bytesPerSecond: bps,
      etaSeconds: bps > 0 ? Math.max(0, (file.size - uploaded) / bps) : null,
    })
  }

  report()

  // Presigned URLs are fetched in batches so they stay well inside their TTL
  // even when the transfer runs long or sits paused.
  let urlCache = {}
  let cursor = 0

  async function urlFor(partNumber) {
    if (!urlCache[partNumber]) {
      const batch = pending.slice(cursor, cursor + SIGN_BATCH)
      if (!batch.includes(partNumber)) batch.push(partNumber)
      urlCache = { ...urlCache, ...(await signParts(batch)) }
      cursor += SIGN_BATCH
    }
    return urlCache[partNumber]
  }

  async function uploadOne(partNumber) {
    const start = (partNumber - 1) * partSize
    const blob = file.slice(start, Math.min(start + partSize, file.size))

    for (let attempt = 0; attempt <= MAX_PART_RETRIES; attempt++) {
      if (signal?.aborted) throw Object.assign(new Error('aborted'), { aborted: true })

      // Hold here while paused; in-flight parts finish, new ones wait.
      while (isPaused() && !signal?.aborted) await sleep(250)

      let partBytes = 0
      try {
        const etag = await putPart({
          url: await urlFor(partNumber),
          blob,
          signal,
          onChunk: (delta) => {
            partBytes += delta
            uploaded += delta
            meter.record(delta)
            report()
          },
        })
        completed.set(partNumber, etag)
        return
      } catch (err) {
        if (err.aborted || signal?.aborted) throw err

        // Roll back this attempt's bytes so progress cannot drift upward on retry.
        uploaded -= partBytes
        report()

        if (attempt === MAX_PART_RETRIES) throw err

        // A dropped connection is the expected case, not an exception — back off
        // and re-sign, since the old URL may have expired while we waited.
        delete urlCache[partNumber]
        await sleep(Math.min(1000 * 2 ** attempt, 15_000))
      }
    }
  }

  // Fixed-size worker pool pulling from the queue.
  const queue = [...pending]
  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (queue.length) {
      const n = queue.shift()
      if (n === undefined) return
      await uploadOne(n)
    }
  })

  await Promise.all(workers)

  return [...completed.entries()]
    .map(([PartNumber, ETag]) => ({ PartNumber, ETag }))
    .sort((a, b) => a.PartNumber - b.PartNumber)
}

export function formatSpeed(bytesPerSecond) {
  if (!bytesPerSecond) return '—'
  const mb = bytesPerSecond / 1024 / 1024
  return mb >= 1 ? `${mb.toFixed(1)} MB/s` : `${(bytesPerSecond / 1024).toFixed(0)} KB/s`
}

export function formatEta(seconds) {
  if (seconds == null || !Number.isFinite(seconds)) return '—'
  if (seconds < 60) return `${Math.ceil(seconds)}s left`
  const m = Math.floor(seconds / 60)
  if (m < 60) return `${m}m ${Math.round(seconds % 60)}s left`
  return `${Math.floor(m / 60)}h ${m % 60}m left`
}
