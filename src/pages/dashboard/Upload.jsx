import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import {
  UploadCloud, File as FileIcon, Pause, Play, X, Check, AlertTriangle,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Label } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/dashboard/shared'
import { VideoProgress } from '@/components/dashboard/VideoProgress'
import { useVideoUpload } from '@/hooks/useVideoUpload'
import { useVideoStatus } from '@/hooks/useVideoStatus'
import { PHASE } from '@/lib/video-progress'
import { formatSpeed, formatEta } from '@/lib/upload/multipart'
import { formatBytes, cn } from '@/lib/utils'

const ACCEPTED = ['video/mp4', 'video/quicktime', 'video/x-matroska', 'video/x-msvideo', 'video/webm']
const MAX_BYTES = 10 * 1024 ** 3

function validateFile(file) {
  if (!file.type.startsWith('video/') && !ACCEPTED.includes(file.type)) {
    return 'That file is not a video. Use MP4, MOV, MKV, AVI or WebM.'
  }
  if (file.size > MAX_BYTES) return `That file is ${formatBytes(file.size)} — the limit is 10 GB.`
  if (file.size === 0) return 'That file is empty.'
  return null
}

/**
 * Collapses the two independent state machines — the client uploader and the
 * server pipeline — into the single phase the bar renders from.
 *
 * The server is only consulted after the upload finishes; before that it has
 * nothing meaningful to say about a video whose bytes have not arrived.
 */
function derivePhase(uploadStatus, serverStatus) {
  if (uploadStatus === 'error') return PHASE.FAILED
  if (uploadStatus === 'idle') return PHASE.IDLE

  if (uploadStatus !== 'done') return PHASE.UPLOADING

  if (serverStatus === 'ready') return PHASE.READY
  if (serverStatus === 'failed') return PHASE.FAILED
  return PHASE.PROCESSING
}

export default function Upload() {
  const queryClient = useQueryClient()
  const inputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [pickError, setPickError] = useState(null)
  const [meta, setMeta] = useState({ title: '', description: '', language: 'en' })

  const upload = useVideoUpload()

  // Once the bytes are in, the pipeline takes over — keep polling the same
  // record so one bar carries the user from upload straight through processing.
  const uploadedVideoId = upload.status === 'done' ? upload.video?.id : null
  const { video: processing } = useVideoStatus(uploadedVideoId)

  const phase = derivePhase(upload.status, processing?.status)
  const busy = ['preparing', 'uploading', 'paused', 'finalising'].includes(upload.status)
  const settled = phase === PHASE.READY || phase === PHASE.FAILED
  const locked = busy || upload.status === 'done'

  function pick(f) {
    if (!f) return
    const problem = validateFile(f)
    setPickError(problem)
    if (problem) return
    setFile(f)
    setMeta((m) => ({ ...m, title: m.title || f.name.replace(/\.[^.]+$/, '') }))
  }

  async function handleStart() {
    try {
      await upload.start(file, meta)
      queryClient.invalidateQueries({ queryKey: ['videos'] })
    } catch { /* surfaced through upload.error */ }
  }

  async function handleCancel() {
    await upload.cancel()
    setFile(null)
  }

  function handleReset() {
    upload.reset()
    setFile(null)
    setMeta({ title: '', description: '', language: 'en' })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Upload video"
        description="Files go straight from your browser to storage in resumable chunks."
      />

      {!file ? (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files?.[0]) }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed px-6 py-20 text-center transition-colors',
              dragging
                ? 'border-primary bg-primary/5'
                : 'border-[var(--glass-border)] hover:border-primary/40 hover:bg-accent/40',
            )}
          >
            <span className="mb-5 grid size-14 place-items-center rounded-xl grad-bg shadow-brand">
              <UploadCloud className="size-6 text-[#04140f]" />
            </span>
            <h3 className="font-display text-lg font-semibold">Drop a video, or click to browse</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              MP4, MOV, MKV, AVI or WebM · up to 10 GB. Uploads retry automatically
              if your connection drops.
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              hidden
              onChange={(e) => pick(e.target.files?.[0])}
            />
          </div>

          {pickError && (
            <div role="alert" className="flex items-center gap-2.5 rounded-[16px] border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              {pickError}
            </div>
          )}
        </>
      ) : (
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-[var(--glass-border)] bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)]">
              <FileIcon className="size-5 text-muted-foreground" />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{file.name}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    {formatBytes(file.size)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {phase === PHASE.READY && (
                    <Badge variant="success"><Check className="size-3" /> Ready</Badge>
                  )}
                  {(upload.status === 'uploading' || upload.status === 'paused') && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={upload.status === 'paused' ? upload.resume : upload.pause}
                        aria-label={upload.status === 'paused' ? 'Resume' : 'Pause'}
                      >
                        {upload.status === 'paused' ? <Play className="size-4" /> : <Pause className="size-4" />}
                      </Button>
                      <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Cancel upload">
                        <X className="size-4" />
                      </Button>
                    </>
                  )}
                  {(upload.status === 'idle' || upload.status === 'error') && (
                    <Button variant="outline" size="icon" onClick={handleReset} aria-label="Remove file">
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* One bar for the whole journey — upload feeds the first half,
                  the pipeline's own progress feeds the second. */}
              <VideoProgress
                className="mt-4"
                phase={upload.status === 'paused' ? PHASE.UPLOADING : phase}
                uploadPercent={upload.percent}
                serverProgress={processing?.progress ?? 0}
                detail={
                  upload.status === 'paused'
                    ? 'paused'
                    : phase === PHASE.PROCESSING
                      ? processing?.status_detail ?? undefined
                      : undefined
                }
                meta={
                  upload.status === 'uploading'
                    ? `${formatSpeed(upload.bytesPerSecond)} · ${formatEta(upload.etaSeconds)}`
                    : phase === PHASE.UPLOADING
                      ? formatBytes(upload.total)
                      : undefined
                }
              />

              {(upload.error || (phase === PHASE.FAILED && processing?.status_detail)) && (
                <div role="alert" className="mt-4 flex items-start gap-2.5 rounded-[14px] border border-destructive/25 bg-destructive/8 px-3.5 py-2.5 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>{upload.error ?? processing?.status_detail}</span>
                </div>
              )}
            </div>
          </div>

          {/* Only offer to move on once the pipeline has actually settled —
              leaving mid-processing is fine, but "Upload another" while the bar
              is still running reads as if the job were finished. */}
          {settled && (
            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-[var(--glass-border)] pt-5">
              <Button variant="outline" onClick={handleReset}>Upload another</Button>
              <Button asChild>
                <Link to="/dashboard/videos">Go to library</Link>
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* metadata */}
      <Card className="p-6">
        <h2 className="mb-5 font-display text-base font-semibold">Details</h2>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Lecture 12 — Thermodynamics"
              value={meta.title}
              disabled={locked}
              onChange={(e) => setMeta({ ...meta, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              rows={3}
              placeholder="What does this lecture cover?"
              value={meta.description}
              disabled={locked}
              onChange={(e) => setMeta({ ...meta, description: e.target.value })}
            />
          </div>
          <div className="space-y-2 sm:max-w-xs">
            <Label htmlFor="lang">Transcript language</Label>
            <select
              id="lang"
              value={meta.language}
              disabled={locked}
              onChange={(e) => setMeta({ ...meta, language: e.target.value })}
              className="h-10 w-full rounded-full border border-[var(--glass-border)] bg-transparent px-3 text-sm outline-none focus:border-ring disabled:opacity-50"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="auto">Auto-detect</option>
            </select>
          </div>
        </div>

        <div className="mt-7 flex justify-end gap-2 border-t border-[var(--glass-border)] pt-5">
          <Button
            onClick={handleStart}
            disabled={!file || busy || upload.status === 'done' || !meta.title.trim()}
          >
            {upload.status === 'error' ? 'Retry upload' : busy ? 'Uploading…' : 'Start upload'}
          </Button>
        </div>
      </Card>

      {/* API hint — nudges dashboard users toward Phase 2 */}
      <Card className="border-dashed p-5">
        <div className="flex items-start gap-3">
          <Badge variant="mono" className="mt-0.5">Phase 2</Badge>
          <div className="min-w-0">
            <p className="text-sm font-medium">Do this from your own server</p>
            <pre className="mt-3 overflow-x-auto rounded-lg border border-[var(--glass-border)] bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)] p-3 font-mono text-[11.5px] leading-relaxed text-muted-foreground">
              <code>{`const upload = await oryn.uploads.create({
  title: 'Lecture 12 — Thermodynamics',
})`}</code>
            </pre>
          </div>
        </div>
      </Card>
    </div>
  )
}
