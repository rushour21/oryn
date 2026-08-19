import { useState } from 'react'
import { useParams, Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Play,
  Copy,
  Check,
  RotateCw,
  Lock,
  Plus,
  Trash2,
  AlertTriangle,
  FastForward,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch, Separator } from '@/components/ui/misc'
import {
  Tabs,
  TabsContent,
  TabsListUnderline,
  TabsTriggerUnderline,
} from '@/components/ui/tabs'
import { PageHeader, StatusPill } from '@/components/dashboard/shared'
import { VideoPlayer } from '@/components/dashboard/VideoPlayer'
import { VideoProgress } from '@/components/dashboard/VideoProgress'
import { AskAIPanel } from '@/components/dashboard/AskAIPanel'
import { useVideoStatus } from '@/hooks/useVideoStatus'
import { phaseForStatus } from '@/lib/video-progress'
import { videosApi } from '@/lib/api/videos'
import { orgApi } from '@/lib/api/org'
import { formatDuration, formatBytes, formatDate } from '@/lib/utils'

/** Queue names the pipeline uses, mapped to something a human wants to read. */
const STEP_LABELS = {
  'media-inspect':   'Inspect source',
  'media-transcode': 'Transcode ladder',
  'media-package':   'Encrypt & package',
  'media-finalize':  'Finalize',
  'media-speech':    'Transcribe',
}

const stepLabel = (step) => STEP_LABELS[step] ?? step

/** ms → the coarsest unit that still reads precisely. */
function formatElapsed(ms) {
  if (ms === null || ms === undefined) return '—'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  const minutes = Math.floor(ms / 60_000)
  const seconds = Math.round((ms % 60_000) / 1000)
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`
}

function CopyField({ value, label }) {
  const [copied, setCopied] = useState(false)
  return (
    <div>
      {label && (
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
      )}
      <div className="flex items-center gap-2 rounded-lg border border-[var(--glass-border)] bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)] px-3 py-2">
        <code className="flex-1 truncate font-mono text-xs">{value}</code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 1600)
          }}
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Copy"
        >
          {copied ? (
            <Check className="size-3.5 text-primary" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
      </div>
    </div>
  )
}

export default function VideoDetail() {
  const { id } = useParams()
  const { video, renditions } = useVideoStatus(id)
  const queryClient = useQueryClient()

  // Only fetched when the Processing tab is actually opened — the timeline
  // grows with every retry, and is usually only wanted when something broke.
  const [tab, setTab] = useState('overview')
  const { data: pipelineData, isLoading: pipelineLoading } = useQuery({
    queryKey: ['pipeline', id],
    queryFn: () => videosApi.getPipeline(id),
    enabled: tab === 'pipeline',
    // A step still running should tick over; a finished pipeline shouldn't poll.
    refetchInterval: (query) =>
      query.state.data?.events?.some((e) => e.status === 'running') ? 3000 : false,
  })
  const pipelineEvents = pipelineData?.events ?? []

  const { data: transcriptData, isLoading: transcriptLoading } = useQuery({
    queryKey: ['transcript', id],
    queryFn: () => videosApi.getTranscript(id),
    enabled: video?.status === 'ready',
    // A 404 here means "no transcript yet", not a transient failure — nothing
    // to retry.
    retry: false,
  })
  const transcript = transcriptData?.transcript ?? null

  const [autoplay, setAutoplay] = useState(false)
  const [loop, setLoop] = useState(false)
  const [domainInput, setDomainInput] = useState('')

  const { data: domainsData } = useQuery({
    queryKey: ['org-domains'],
    queryFn: () => orgApi.listDomains(),
  })
  const orgDomains = domainsData?.domains ?? []

  const addDomain = useMutation({
    mutationFn: (domain) => orgApi.addDomain(domain),
    onSuccess: () => {
      setDomainInput('')
      queryClient.invalidateQueries({ queryKey: ['org-domains'] })
    },
  })
  const removeDomain = useMutation({
    mutationFn: (domainId) => orgApi.removeDomain(domainId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['org-domains'] }),
  })

  if (!video) {
    return (
      <div className="mx-auto max-w-6xl">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  const embedParams = new URLSearchParams({
    ...(autoplay && { autoplay: '1' }),
    ...(loop && { loop: '1' }),
  }).toString()
  const embedSrc = `${window.location.origin}/embed/${video.id}${embedParams ? `?${embedParams}` : ''}`
  const embedCode = `<iframe
  src="${embedSrc}"
  width="100%" height="480" frameborder="0"
  allow="fullscreen; encrypted-media"
  allowfullscreen></iframe>`

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link
        to="/dashboard/videos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Videos
      </Link>

      <PageHeader
        title={video.title}
        description={
          <span className="flex flex-wrap items-center gap-2 font-mono text-xs">
            {video.id} · {formatDuration(video.duration_seconds)} ·{' '}
            {formatBytes(video.size_bytes)} · {formatDate(video.created_at)}
          </span>
        }
        action={
          <div className="flex gap-2">
            <Button variant="outline">
              <RotateCw className="size-4" /> Reprocess
            </Button>
            <Button>
              <Play className="size-4" /> Preview
            </Button>
          </div>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsListUnderline>
          <TabsTriggerUnderline value="overview">Overview</TabsTriggerUnderline>
          <TabsTriggerUnderline value="renditions">Qualities</TabsTriggerUnderline>
          <TabsTriggerUnderline value="pipeline">Processing</TabsTriggerUnderline>
          <TabsTriggerUnderline value="transcript">Transcript</TabsTriggerUnderline>
          <TabsTriggerUnderline value="ask">Ask AI</TabsTriggerUnderline>
          <TabsTriggerUnderline value="embed">Embed</TabsTriggerUnderline>
        </TabsListUnderline>

        {/* ---------- Overview ---------- */}
        <TabsContent value="overview">
          <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-gradient-to-br from-secondary to-background">
                {video.status === 'ready' ? (
                  <VideoPlayer videoId={id} />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-grid opacity-50" />
                    <div className="absolute inset-0 grid place-items-center px-8">
                      <VideoProgress
                        className="w-full max-w-xs"
                        phase={phaseForStatus(video.status)}
                        serverProgress={video.progress}
                        detail={video.status_detail}
                      />
                    </div>
                  </>
                )}
                <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-background/75 px-2 py-1 font-mono text-[10px] backdrop-blur">
                  <Lock className="size-3 text-primary" /> AES-128
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="mb-4 font-display text-base font-semibold">Details</h3>
              <dl className="space-y-3.5 text-sm">
                {[
                  ['Status', <StatusPill key="s" status={video.status} />],
                  ['Duration', formatDuration(video.duration_seconds)],
                  ['Source size', formatBytes(video.size_bytes)],
                  [
                    'Source',
                    video.width && video.height
                      ? `${video.width}×${video.height}${video.video_codec ? ` · ${video.video_codec}` : ''}`
                      : 'Pending inspection',
                  ],
                  ['Uploaded', formatDate(video.created_at)],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>

              <Separator className="my-5" />
              <div className="space-y-3">
                <CopyField label="Video ID" value={video.id} />
                <CopyField
                  label="Playback URL"
                  value={`${window.location.origin}/embed/${video.id}`}
                />
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ---------- Renditions ---------- */}
        <TabsContent value="renditions">
          {renditions.length === 0 ? (
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">
                {video.status === 'ready'
                  ? 'No qualities were recorded for this video.'
                  : 'Qualities appear here as the transcode ladder produces them.'}
              </p>
            </Card>
          ) : (
            <Card className="divide-y divide-[var(--glass-border)]">
              {renditions.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center gap-4 p-4 sm:px-5"
                >
                  <Badge variant="mono" className="w-16 justify-center">
                    {r.name}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {r.bitrate_kbps.toLocaleString()} kbps
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {r.width}×{r.height} · {r.codec} · cbcs
                    </p>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {r.size_bytes ? formatBytes(r.size_bytes) : '—'}
                  </p>
                </div>
              ))}
            </Card>
          )}

          <p className="mt-4 font-mono text-[11px] text-muted-foreground">
            Ladder chosen from the source resolution — nothing is upscaled.
          </p>
        </TabsContent>

        {/* ---------- Pipeline ---------- */}
        <TabsContent value="pipeline">
          <Card className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-semibold">
                  Processing timeline
                </h3>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {pipelineEvents.length === 0
                    ? '—'
                    : `Total ${formatElapsed(
                        pipelineEvents.reduce((sum, e) => sum + (e.duration_ms ?? 0), 0),
                      )} · ${pipelineEvents.length} step${pipelineEvents.length === 1 ? '' : 's'}`}
                </p>
              </div>
            </div>

            {pipelineLoading ? (
              <p className="text-sm text-muted-foreground">Loading timeline…</p>
            ) : pipelineEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No processing steps recorded yet. Steps appear here as the pipeline runs.
              </p>
            ) : (
              <ol className="relative space-y-1">
                <span className="absolute left-[15px] top-3 h-[calc(100%-24px)] w-px bg-border" />
                {pipelineEvents.map((e) => {
                  const failed = e.status === 'failed'
                  const running = e.status === 'running'
                  return (
                    <li key={e.id} className="relative flex gap-4 py-3">
                      <span
                        className={
                          'relative z-10 mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border ' +
                          (failed
                            ? 'border-destructive/40 bg-destructive/10'
                            : running
                              ? 'border-border bg-secondary'
                              : 'border-primary/35 bg-primary/10')
                        }
                      >
                        {failed ? (
                          <AlertTriangle className="size-3.5 text-destructive" />
                        ) : running ? (
                          <RotateCw className="size-3.5 animate-spin text-muted-foreground" />
                        ) : (
                          <Check className="size-3.5 text-primary" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="text-sm font-medium">
                            {stepLabel(e.step)}
                            {e.attempt > 1 && (
                              <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                                attempt {e.attempt}
                              </span>
                            )}
                          </p>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            {running ? 'running…' : formatElapsed(e.duration_ms)}
                          </p>
                        </div>
                        {/* The error is shown verbatim on purpose: diagnosing a
                            stuck video from this screen is the whole point of
                            the tab, and a friendly paraphrase would lose the
                            detail that makes it diagnosable. */}
                        {failed && e.error && (
                          <p className="mt-1 break-words font-mono text-[11px] text-destructive">
                            {e.error}
                          </p>
                        )}
                        {!failed && e.detail && (
                          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                            {e.detail}
                          </p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </Card>
        </TabsContent>

        {/* ---------- Transcript ---------- */}
        <TabsContent value="transcript">
          <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
            <Card className="divide-y divide-[var(--glass-border)]">
              {video.status !== 'ready' ? (
                <p className="p-5 text-sm text-muted-foreground">
                  Transcript will appear once processing finishes.
                </p>
              ) : transcriptLoading ? (
                <p className="p-5 text-sm text-muted-foreground">Loading transcript…</p>
              ) : !transcript ? (
                <p className="p-5 text-sm text-muted-foreground">
                  No transcript yet — it may still be transcribing, or this video has no
                  spoken audio.
                </p>
              ) : (
                transcript.chunks.map((c) => (
                  <button
                    key={c.id}
                    className="flex w-full gap-4 p-4 text-left transition-colors hover:bg-accent/50"
                  >
                    <span className="inline-flex h-6 shrink-0 items-center gap-1 rounded-md border border-primary/25 bg-primary/8 px-1.5 font-mono text-[11px] text-primary">
                      <FastForward className="size-3" />
                      {formatDuration(c.start)}
                    </span>
                    <span className="text-sm leading-relaxed text-muted-foreground">
                      {c.text}
                    </span>
                  </button>
                ))
              )}
            </Card>

            <div className="space-y-4">
              <Card className="p-5">
                <h3 className="mb-4 font-display text-sm font-semibold">Index</h3>
                <dl className="space-y-3 text-sm">
                  {[
                    ['Model', transcript?.model ?? '—'],
                    ['Language', transcript?.language ?? '—'],
                    ['Segments', transcript?.segments?.length ?? '—'],
                    ['Chunks', transcript?.chunks?.length ?? '—'],
                    ['Overlap', '15s'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="font-mono text-xs">{v}</dd>
                    </div>
                  ))}
                </dl>
              </Card>

              <Card className="p-5">
                <h3 className="mb-3 font-display text-sm font-semibold">Export</h3>
                <div className="flex flex-wrap gap-2">
                  {['VTT', 'SRT', 'TXT', 'JSON'].map((f) => (
                    <Button key={f} variant="outline" size="sm">
                      {f}
                    </Button>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ---------- Ask AI ---------- */}
        <TabsContent value="ask">
          <AskAIPanel videoId={id} video={video} transcript={transcript} />
        </TabsContent>

        {/* ---------- Embed ---------- */}
        <TabsContent value="embed">
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div className="space-y-5">
              <Card className="overflow-hidden p-0">
                <div className="aspect-video bg-black">
                  {video.status === 'ready' ? (
                    <iframe
                      key={embedSrc}
                      src={embedSrc}
                      title="Embed preview"
                      className="size-full border-0"
                      allow="fullscreen; encrypted-media; autoplay"
                      allowFullScreen
                    />
                  ) : (
                    <div className="grid size-full place-items-center p-6 text-center text-sm text-muted-foreground">
                      Preview will work once this video finishes processing.
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="mb-4 font-display text-base font-semibold">
                  Embed code
                </h3>
                <pre className="overflow-x-auto rounded-lg border border-[var(--glass-border)] bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)] p-4 font-mono text-[12px] leading-relaxed text-muted-foreground">
                  <code>{embedCode}</code>
                </pre>
                <Button
                  className="mt-4"
                  onClick={() => navigator.clipboard?.writeText(embedCode)}
                >
                  <Copy className="size-4" /> Copy embed code
                </Button>
              </Card>

              <Card className="p-5">
                <h3 className="mb-2 font-display text-base font-semibold">
                  WordPress shortcode
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Install the ORYN plugin, then paste this into any post.
                </p>
                <CopyField value={`[oryn video="${video.id}"]`} />
              </Card>
            </div>

            <div className="space-y-5">
              <Card className="p-5">
                <h3 className="mb-4 font-display text-sm font-semibold">Options</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">Autoplay (muted)</span>
                    <Switch checked={autoplay} onCheckedChange={setAutoplay} />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">Loop</span>
                    <Switch checked={loop} onCheckedChange={setLoop} />
                  </div>
                  <div className="flex items-center justify-between gap-3 opacity-50">
                    <span className="text-sm text-muted-foreground">Show Ask AI drawer</span>
                    <Switch checked={false} disabled />
                  </div>
                </div>
                <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                  Ask AI inside the embedded player is coming soon — for now, viewers
                  watch here and questions happen back in this dashboard.
                </p>
              </Card>

              <Card className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold">
                    Allowed domains
                  </h3>
                  <Badge variant="mono">{orgDomains.length}</Badge>
                </div>
                <ul className="space-y-2">
                  {orgDomains.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-[var(--glass-border)] bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)] px-2.5 py-1.5"
                    >
                      <code className="truncate font-mono text-[11px]">
                        {d.domain}
                      </code>
                      <button
                        type="button"
                        onClick={() => removeDomain.mutate(d.id)}
                        disabled={removeDomain.isPending}
                        className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                        aria-label={`Remove ${d.domain}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
                <form
                  className="mt-3 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (domainInput.trim()) addDomain.mutate(domainInput.trim())
                  }}
                >
                  <Input
                    placeholder="academy.com"
                    className="h-9 text-xs"
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    variant="outline"
                    aria-label="Add domain"
                    disabled={addDomain.isPending || !domainInput.trim()}
                  >
                    <Plus className="size-4" />
                  </Button>
                </form>
                {addDomain.isError && (
                  <p className="mt-2 text-[11px] text-destructive">
                    {addDomain.error?.message ?? 'Could not add that domain.'}
                  </p>
                )}
                <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                  Playback is blocked anywhere else, checked against the embedding
                  page's referrer when it requests a viewing session.
                </p>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
