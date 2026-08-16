import { useCallback, useRef, useState } from 'react'
import { videosApi } from '@/lib/api/videos'
import { uploadFileInParts } from '@/lib/upload/multipart'

const IDLE = {
  status: 'idle', // idle | preparing | uploading | paused | finalising | done | error
  percent: 0,
  uploaded: 0,
  total: 0,
  bytesPerSecond: 0,
  etaSeconds: null,
  error: null,
  video: null,
}

/**
 * Drives one upload: create the record, push the parts, complete.
 *
 * Progress arrives from a non-React loop firing many times a second, so it is
 * held in a ref and flushed to state on a rAF — setting state per XHR progress
 * event would swamp the renderer on a large file.
 */
export function useVideoUpload() {
  const [state, setState] = useState(IDLE)

  const abortRef = useRef(null)
  const pausedRef = useRef(false)
  const videoRef = useRef(null)
  const progressRef = useRef(null)
  const frameRef = useRef(0)

  const flush = useCallback(() => {
    frameRef.current = 0
    const p = progressRef.current
    if (p) setState((s) => ({ ...s, ...p }))
  }, [])

  const pushProgress = useCallback((p) => {
    progressRef.current = p
    if (!frameRef.current) frameRef.current = requestAnimationFrame(flush)
  }, [flush])

  const start = useCallback(async (file, meta = {}) => {
    const controller = new AbortController()
    abortRef.current = controller
    pausedRef.current = false

    setState({ ...IDLE, status: 'preparing', total: file.size })

    try {
      const { video, upload } = await videosApi.create({
        filename: file.name,
        size: file.size,
        contentType: file.type || 'application/octet-stream',
        ...meta,
      })
      videoRef.current = video
      setState((s) => ({ ...s, status: 'uploading', video }))

      // Anything already stored (from an earlier attempt on this record) is
      // skipped rather than re-sent.
      const { parts: existingParts } = await videosApi.listParts(video.id)

      const parts = await uploadFileInParts({
        file,
        partSize: upload.part_size,
        existingParts,
        signal: controller.signal,
        isPaused: () => pausedRef.current,
        signParts: async (partNumbers) => {
          const { urls } = await videosApi.signParts(video.id, partNumbers)
          return urls
        },
        onProgress: pushProgress,
      })

      setState((s) => ({ ...s, status: 'finalising' }))
      const { video: finished } = await videosApi.complete(video.id, parts)

      videoRef.current = finished
      setState((s) => ({ ...s, status: 'done', percent: 100, video: finished, bytesPerSecond: 0, etaSeconds: 0 }))
      return finished
    } catch (err) {
      if (err.aborted || controller.signal.aborted) {
        setState(IDLE)
        return null
      }
      setState((s) => ({ ...s, status: 'error', error: err.message ?? 'Upload failed' }))
      throw err
    }
  }, [pushProgress])

  const pause = useCallback(() => {
    pausedRef.current = true
    setState((s) => (s.status === 'uploading' ? { ...s, status: 'paused', bytesPerSecond: 0, etaSeconds: null } : s))
  }, [])

  const resume = useCallback(() => {
    pausedRef.current = false
    setState((s) => (s.status === 'paused' ? { ...s, status: 'uploading' } : s))
  }, [])

  const cancel = useCallback(async () => {
    abortRef.current?.abort()
    pausedRef.current = false
    const video = videoRef.current
    videoRef.current = null
    setState(IDLE)
    // Release the storage-side multipart upload so the parts are not billed.
    if (video?.id) await videosApi.abort(video.id).catch(() => {})
  }, [])

  const reset = useCallback(() => {
    videoRef.current = null
    setState(IDLE)
  }, [])

  return { ...state, start, pause, resume, cancel, reset }
}
