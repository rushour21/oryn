import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Search, Film, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/misc'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader, StatusPill, EmptyState } from '@/components/dashboard/shared'
import { VideoProgress } from '@/components/dashboard/VideoProgress'
import { videosApi } from '@/lib/api/videos'
import { isActive, PHASE } from '@/lib/video-progress'
import { formatDuration, formatBytes, formatDate, cn } from '@/lib/utils'

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Ready', value: 'ready' },
  { label: 'Processing', value: 'processing' },
  { label: 'Failed', value: 'failed' },
]

const POLL_MS = 3000

export default function Videos() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const queryClient = useQueryClient()

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['videos', filter],
    queryFn: () => videosApi.list({ status: filter }),
    // Keep polling only while something is still moving, then stop. A library of
    // finished videos costs nothing; one mid-encode refreshes itself.
    refetchInterval: (q) =>
      (q.state.data?.videos ?? []).some((v) => isActive(v.status)) ? POLL_MS : false,
    // Encoding continues in a background tab, so the list must too — otherwise
    // returning to the tab shows stale progress until the next tick.
    refetchIntervalInBackground: true,
    staleTime: 0,
  })

  const remove = useMutation({
    mutationFn: videosApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['videos'] }),
  })

  const all = useMemo(() => data?.videos ?? [], [data])

  // Search is client-side on the current page: the API paginates, and round-
  // tripping every keystroke would be worse than filtering what is already here.
  const rows = useMemo(
    () => all.filter((v) => v.title?.toLowerCase().includes(query.toLowerCase())),
    [all, query],
  )

  const total = data?.total ?? 0

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Videos"
        description={
          isLoading
            ? 'Loading…'
            : `${total} video${total === 1 ? '' : 's'} in this project`
        }
        action={
          <Button asChild>
            <Link to="/dashboard/upload">Upload video</Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search videos…"
            className="rounded-full pl-9"
          />
        </div>

        <div className="flex items-center gap-0.5 rounded-full border border-[var(--glass-border)] bg-[color-mix(in_oklab,var(--foreground)_3%,transparent)] p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-medium transition-all',
                filter === f.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="shrink-0 rounded-full"
          aria-label="Refresh"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['videos'] })}
        >
          <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
        </Button>
      </div>

      {error ? (
        <Card className="p-6">
          <div role="alert" className="flex items-center gap-2.5 text-sm text-destructive">
            <AlertTriangle className="size-4 shrink-0" />
            {error.message}
          </div>
        </Card>
      ) : isLoading ? (
        <Card className="space-y-3 p-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </Card>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Film}
          title={all.length === 0 ? 'No videos yet' : 'No videos match'}
          description={
            all.length === 0
              ? 'Upload your first lecture and it will appear here once processed.'
              : 'Try a different search term or clear the status filter.'
          }
          action={
            all.length === 0 ? (
              <Button asChild>
                <Link to="/dashboard/upload">Upload your first video</Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setQuery('')
                  setFilter('all')
                }}
              >
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Video</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Length</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((v) => (
                <VideoRow
                  key={v.id}
                  video={v}
                  onDelete={() => remove.mutate(v.id)}
                  deleting={remove.isPending && remove.variables === v.id}
                />
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t border-[var(--glass-border)] px-4 py-3">
            <p className="font-mono text-[11px] text-muted-foreground">
              Showing {rows.length} of {total}
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}

function VideoRow({ video: v, onDelete, deleting }) {
  const working = isActive(v.status)
  const best = v.height ? `${v.height}p` : null

  return (
    <TableRow className={cn(deleting && 'opacity-50')}>
      <TableCell>
        <Link to={`/dashboard/videos/${v.id}`} className="group flex items-center gap-3">
          <span
            className={cn(
              'grid h-10 w-[72px] shrink-0 place-items-center overflow-hidden rounded-[10px] border font-mono text-[9px] font-semibold transition-colors',
              v.status === 'ready'
                ? 'border-primary/20 bg-primary/8 text-primary'
                : v.status === 'failed'
                  ? 'border-destructive/20 bg-destructive/8 text-destructive'
                  : working
                    ? 'border-warning/20 bg-warning/8 text-warning'
                    : 'border-[var(--glass-border)] bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)] text-muted-foreground',
            )}
          >
            {v.status === 'ready' && best ? best : <Film className="size-3.5 opacity-40" />}
          </span>

          <span className="min-w-0">
            <span className="line-clamp-1 font-medium transition-colors group-hover:text-primary">
              {v.title}
            </span>
            <span className="mt-0.5 block truncate font-mono text-[10px] text-muted-foreground">
              {v.original_name}
            </span>
          </span>
        </Link>
      </TableCell>

      <TableCell className="min-w-[190px]">
        {working ? (
          // A live bar in the row is what makes the library useful while an
          // encode is running — a static "processing" pill tells you nothing
          // about whether it is stuck.
          <VideoProgress
            compact
            phase={PHASE.PROCESSING}
            serverProgress={v.progress ?? 0}
            detail={v.status_detail ?? undefined}
          />
        ) : (
          <div className="space-y-1">
            <StatusPill status={v.status} />
            {v.status === 'failed' && v.status_detail && (
              <p className="line-clamp-2 max-w-[220px] font-mono text-[10px] text-destructive/80">
                {v.status_detail}
              </p>
            )}
          </div>
        )}
      </TableCell>

      <TableCell className="font-mono text-xs text-muted-foreground">
        {v.duration_seconds ? formatDuration(v.duration_seconds) : '—'}
      </TableCell>

      <TableCell className="font-mono text-xs text-muted-foreground">
        {formatBytes(v.size_bytes)}
      </TableCell>

      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
        {formatDate(v.created_at)}
      </TableCell>

      <TableCell>
        <button
          onClick={onDelete}
          disabled={deleting}
          aria-label={`Delete ${v.title}`}
          className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40"
        >
          <Trash2 className="size-4" />
        </button>
      </TableCell>
    </TableRow>
  )
}
