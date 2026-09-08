/**
 * oryn-upload — resumable chunked video upload for the browser (PRD F18).
 *
 * This is the only package ORYN publishes, and it exists because exactly one
 * part of integrating is genuinely hard to hand-roll: getting a multi-gigabyte
 * file from a browser to storage over a connection that will drop. Playback is
 * an iframe, and every other operation is a plain `fetch` — neither needs code
 * shipped from us.
 *
 * Zero dependencies, native fetch only. A package whose whole job is "upload a
 * file reliably" earning a dependency tree would be its own argument against
 * installing it.
 *
 * Usage:
 *
 *   import { uploadVideo } from 'oryn-upload'
 *
 *   // Your server calls POST /v1/uploads with its secret key and returns
 *   // the `upload` object from the response to your page.
 *   await uploadVideo(file, {
 *     upload,                              // that object, verbatim
 *     onProgress: (p) => setPercent(p),
 *   })
 */

const DEFAULT_BASE_URL = 'https://api.oryn.com';

/** How many parts to presign in one request. Matches the API's own cap. */
const PRESIGN_BATCH = 50;

/** Parts uploaded at once. Enough to saturate a connection, few enough that a
 *  phone on mobile data is not trying to hold ten sockets open. */
const DEFAULT_CONCURRENCY = 3;

const DEFAULT_MAX_RETRIES = 5;

export class OrynUploadError extends Error {
  constructor(message, { code, cause } = {}) {
    super(message);
    this.name = 'OrynUploadError';
    this.code = code ?? 'UPLOAD_FAILED';
    if (cause) this.cause = cause;
  }
}

/**
 * Refuses anything that looks like a secret key.
 *
 * A secret key in page JavaScript is readable by every visitor and grants
 * everything the account can do. The realistic way that happens is not
 * recklessness but a copy-paste from a server example into a component, so
 * this fails loudly at the call rather than uploading successfully and leaving
 * the key sitting in a bundle.
 */
function assertNotSecretKey(value, field) {
  if (typeof value === 'string' && /(^|\b)sk_/.test(value)) {
    throw new OrynUploadError(
      `${field} looks like a secret API key (sk_…). Secret keys must never reach a browser — ` +
      'call POST /v1/uploads from your server and pass the returned `upload` object to the page instead.',
      { code: 'SECRET_KEY_IN_BROWSER' },
    );
  }
}

/** Sleep with exponential backoff and jitter, so retries don't sync up. */
function backoff(attempt) {
  const base = Math.min(1000 * 2 ** attempt, 30_000);
  return new Promise((r) => setTimeout(r, base * (0.5 + Math.random() * 0.5)));
}

/**
 * A single upload in progress. Returned by `uploadVideo` so a caller can
 * pause, resume or abort it — a 4 GB upload is long enough that a user will
 * want to, and long enough that a page might need to stop one on unmount.
 */
class Upload {
  #file;
  #options;
  #controller = new AbortController();
  #paused = false;
  #resumeSignal = null;
  #completed = new Map(); // partNumber -> ETag
  #uploadedBytes = 0;

  constructor(file, options) {
    this.#file = file;
    this.#options = options;
  }

  get progress() {
    return this.#file.size === 0 ? 100 : Math.min(100, (this.#uploadedBytes / this.#file.size) * 100);
  }

  pause() {
    this.#paused = true;
  }

  resume() {
    if (!this.#paused) return;
    this.#paused = false;
    this.#resumeSignal?.();
    this.#resumeSignal = null;
  }

  abort() {
    this.#controller.abort();
    this.resume(); // unblock anything parked in #waitWhilePaused
  }

  async #waitWhilePaused() {
    while (this.#paused) {
      if (this.#controller.signal.aborted) throw new OrynUploadError('Upload aborted.', { code: 'ABORTED' });
      await new Promise((r) => { this.#resumeSignal = r; });
    }
  }

  /** Presigns a batch of part URLs, retrying — this is on the critical path
   *  and a single blip should not lose an hour of transferred bytes. */
  async #presign(partNumbers) {
    const { baseUrl, upload, uploadToken } = this.#options;

    for (let attempt = 0; ; attempt++) {
      try {
        const res = await fetch(`${baseUrl}${upload.parts_url}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${uploadToken}`,
          },
          body: JSON.stringify({ part_numbers: partNumbers }),
          signal: this.#controller.signal,
        });

        if (res.ok) return (await res.json()).data.urls;

        // 4xx is a bad request or a dead token; retrying cannot fix either.
        if (res.status >= 400 && res.status < 500) {
          throw new OrynUploadError(
            `Could not get upload URLs (${res.status}). The upload token may have expired.`,
            { code: 'PRESIGN_REJECTED' },
          );
        }
        throw new OrynUploadError(`Could not get upload URLs (${res.status}).`, { code: 'PRESIGN_FAILED' });
      } catch (err) {
        if (this.#controller.signal.aborted) throw new OrynUploadError('Upload aborted.', { code: 'ABORTED' });
        if (err.code === 'PRESIGN_REJECTED' || attempt >= this.#options.maxRetries) throw err;
        await backoff(attempt);
      }
    }
  }

  /**
   * Uploads one part, retrying on failure.
   *
   * Progress is only credited when a part lands, never as bytes leave: a part
   * that fails halfway and retries would otherwise push the bar past 100%, and
   * a progress bar that lies is worse than a coarse one.
   */
  async #uploadPart(partNumber, url, blob) {
    for (let attempt = 0; ; attempt++) {
      await this.#waitWhilePaused();
      try {
        const res = await fetch(url, {
          method: 'PUT',
          body: blob,
          signal: this.#controller.signal,
        });

        if (!res.ok) throw new OrynUploadError(`Part ${partNumber} failed (${res.status}).`, { code: 'PART_FAILED' });

        // S3 returns the part's ETag in a header; completing needs it.
        const etag = res.headers.get('etag')?.replace(/"/g, '');
        if (!etag) {
          throw new OrynUploadError(
            `Part ${partNumber} uploaded but returned no ETag. If your storage is behind a proxy or CDN, ` +
            'it must expose the ETag header to the browser.',
            { code: 'MISSING_ETAG' },
          );
        }

        this.#completed.set(partNumber, etag);
        this.#uploadedBytes += blob.size;
        this.#options.onProgress?.(this.progress);
        return;
      } catch (err) {
        if (this.#controller.signal.aborted) throw new OrynUploadError('Upload aborted.', { code: 'ABORTED' });
        if (err.code === 'MISSING_ETAG' || attempt >= this.#options.maxRetries) throw err;
        await backoff(attempt);
      }
    }
  }

  async #complete() {
    const { baseUrl, upload, uploadToken } = this.#options;

    // Sorted, because S3 rejects a completion whose parts are out of order —
    // and concurrency means they finish out of order by design.
    const parts = [...this.#completed.entries()]
      .map(([PartNumber, ETag]) => ({ PartNumber, ETag }))
      .sort((a, b) => a.PartNumber - b.PartNumber);

    for (let attempt = 0; ; attempt++) {
      try {
        const res = await fetch(`${baseUrl}${upload.complete_url}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${uploadToken}`,
            // Completing twice is a normal outcome of a retried request, and
            // the API treats a repeat as "tell me the current state" rather
            // than an error. This makes that explicit.
            'Idempotency-Key': `complete-${upload.upload_id}`,
          },
          body: JSON.stringify({ parts }),
          signal: this.#controller.signal,
        });

        if (res.ok) return (await res.json()).data;
        if (res.status >= 400 && res.status < 500) {
          throw new OrynUploadError(`Could not finish the upload (${res.status}).`, { code: 'COMPLETE_REJECTED' });
        }
        throw new OrynUploadError(`Could not finish the upload (${res.status}).`, { code: 'COMPLETE_FAILED' });
      } catch (err) {
        if (this.#controller.signal.aborted) throw new OrynUploadError('Upload aborted.', { code: 'ABORTED' });
        if (err.code === 'COMPLETE_REJECTED' || attempt >= this.#options.maxRetries) throw err;
        await backoff(attempt);
      }
    }
  }

  /** Runs the upload. Resolves with the API's completion response. */
  async start() {
    const { upload, concurrency } = this.#options;
    const partSize = upload.part_size;
    const partCount = upload.part_count;

    // Presigned in batches rather than all at once: a 5 GB file is hundreds of
    // parts, and URLs signed at the start would be expiring by the time the
    // last one is needed.
    for (let start = 1; start <= partCount; start += PRESIGN_BATCH) {
      const numbers = [];
      for (let n = start; n < start + PRESIGN_BATCH && n <= partCount; n++) numbers.push(n);

      const urls = await this.#presign(numbers);

      // A small worker pool over the batch, rather than firing every part at
      // once — hundreds of parallel PUTs stall each other and, on mobile, the
      // browser simply queues them anyway.
      let cursor = 0;
      const worker = async () => {
        while (cursor < numbers.length) {
          const partNumber = numbers[cursor++];
          const from = (partNumber - 1) * partSize;
          const blob = this.#file.slice(from, Math.min(from + partSize, this.#file.size));
          await this.#uploadPart(partNumber, urls[partNumber], blob);
        }
      };

      await Promise.all(Array.from({ length: Math.min(concurrency, numbers.length) }, worker));
    }

    return this.#complete();
  }
}

/**
 * Uploads a file to ORYN.
 *
 * `upload` is the object your server received from POST /v1/uploads — pass it
 * through unchanged. It carries the part size, the part count, the two URLs to
 * call and a token scoped to this one upload, so the page never needs a key.
 *
 * Returns a promise for the completed video, with `.pause()`, `.resume()` and
 * `.abort()` attached so the caller can drive a long transfer.
 */
export function uploadVideo(file, {
  upload,
  uploadToken,
  baseUrl = DEFAULT_BASE_URL,
  onProgress,
  concurrency = DEFAULT_CONCURRENCY,
  maxRetries = DEFAULT_MAX_RETRIES,
} = {}) {
  if (!file || typeof file.slice !== 'function' || typeof file.size !== 'number') {
    throw new OrynUploadError('First argument must be a File or Blob.', { code: 'INVALID_FILE' });
  }
  if (!upload || !upload.parts_url || !upload.complete_url || !upload.part_size || !upload.part_count) {
    throw new OrynUploadError(
      'Missing `upload`. Pass the `upload` object from your server\'s POST /v1/uploads response.',
      { code: 'INVALID_UPLOAD' },
    );
  }

  // Accept the token from the upload object (where the API puts it) or
  // separately, and refuse a secret key in either position.
  const token = uploadToken ?? upload.upload_token;
  assertNotSecretKey(token, 'uploadToken');
  assertNotSecretKey(baseUrl, 'baseUrl');
  if (!token) {
    throw new OrynUploadError('Missing `upload.upload_token`.', { code: 'INVALID_UPLOAD' });
  }

  const instance = new Upload(file, {
    upload,
    uploadToken: token,
    baseUrl: baseUrl.replace(/\/$/, ''),
    onProgress,
    concurrency,
    maxRetries,
  });

  const promise = instance.start();
  promise.pause = () => instance.pause();
  promise.resume = () => instance.resume();
  promise.abort = () => instance.abort();
  return promise;
}

export default { uploadVideo, OrynUploadError };
