import { useRef, useState, useEffect } from 'react'
import { UploadCloud, File as FileIcon, Pause, Play, X, Check } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Label } from '@/components/ui/input'
import { Progress } from '@/components/ui/misc'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/dashboard/shared'
import { formatBytes, cn } from '@/lib/utils'

const STAGES = [
  'Uploading',
  'Inspecting source',
  'Transcoding 720p',
  'Encrypting segments',
  'Transcribing audio',
  'Ready',
]

/** Simulated upload — swap for Uppy + presigned S3 multipart. */
function useFakeUpload(file) {
  const [pct, setPct] = useState(0)
  const [stage, setStage] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!file) return
    const id = setInterval(() => {
      if (paused) return
      setPct((p) => {
        const next = Math.min(100, p + Math.random() * 7)
        setStage(Math.min(STAGES.length - 1, Math.floor((next / 100) * STAGES.length)))
        return next
      })
    }, 380)
    return () => clearInterval(id)
  }, [file, paused])

  return { pct, stage, paused, setPaused }
}

export default function Upload() {
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)
  const { pct, stage, paused, setPaused } = useFakeUpload(file)

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) setFile(f)
  }

  const done = pct >= 100

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Upload video"
        description="Files go straight from your browser to storage in resumable chunks."
      />

      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
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
          <h3 className="font-display text-lg font-semibold">
            Drop a video, or click to browse
          </h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            MP4, MOV, MKV, AVI or WebM · up to 5 GB. Uploads resume automatically
            if your connection drops.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            hidden
            onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
          />
        </div>
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
                  {done ? (
                    <Badge variant="success">
                      <Check className="size-3" /> Ready
                    </Badge>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPaused((p) => !p)}
                        aria-label={paused ? 'Resume' : 'Pause'}
                      >
                        {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setFile(null)}
                        aria-label="Cancel"
                      >
                        <X className="size-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <Progress value={pct} />
                <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                  <span className={cn(!done && 'text-primary')}>
                    {STAGES[stage]}
                    {paused && ' · paused'}
                  </span>
                  <span>
                    {Math.round(pct)}% · {done ? 'complete' : '4.2 MB/s'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* pipeline preview */}
          <div className="mt-7 flex flex-wrap gap-1.5 border-t border-[var(--glass-border)] pt-5">
            {STAGES.map((s, i) => (
              <span
                key={s}
                className={cn(
                  'rounded-md border px-2 py-1 font-mono text-[10px] transition-colors',
                  i < stage
                    ? 'border-primary/30 bg-primary/8 text-primary'
                    : i === stage
                      ? 'border-primary/40 bg-primary/12 text-primary'
                      : 'border-border text-muted-foreground/60',
                )}
              >
                {s}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* metadata */}
      <Card className="p-6">
        <h2 className="mb-5 font-display text-base font-semibold">Details</h2>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Lecture 12 — Thermodynamics" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              rows={3}
              placeholder="What does this lecture cover?"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" placeholder="chemistry, semester-2" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lang">Transcript language</Label>
              <select
                id="lang"
                className="h-10 w-full rounded-full border border-[var(--glass-border)] bg-transparent px-3 text-sm outline-none focus:border-ring"
              >
                <option>English</option>
                <option>Hindi</option>
                <option>Auto-detect</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-7 flex justify-end gap-2 border-t border-[var(--glass-border)] pt-5">
          <Button variant="outline">Save draft</Button>
          <Button disabled={!done}>Publish</Button>
        </div>
      </Card>

      {/* API hint — nudges dashboard users toward Phase 2 */}
      <Card className="border-dashed p-5">
        <div className="flex items-start gap-3">
          <Badge variant="mono" className="mt-0.5">
            Phase 2
          </Badge>
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
