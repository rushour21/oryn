import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Search, SlidersHorizontal, Film, MessagesSquare, Eye } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader, StatusPill, EmptyState } from '@/components/dashboard/shared'
import { videos } from '@/data/mock'
import { formatDuration, formatBytes, formatDate, cn } from '@/lib/utils'

const FILTERS = ['All', 'Ready', 'Processing', 'Failed']

export default function Videos() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')

  const rows = useMemo(
    () =>
      videos.filter((v) => {
        const matchesQuery = v.title.toLowerCase().includes(query.toLowerCase())
        const matchesFilter =
          filter === 'All' || v.status === filter.toLowerCase()
        return matchesQuery && matchesFilter
      }),
    [query, filter],
  )

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Videos"
        description={`${videos.length} videos in this project`}
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
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-medium transition-all',
                filter === f
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] hover:text-foreground',
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <Button variant="outline" size="icon" className="rounded-full shrink-0" aria-label="More filters">
          <SlidersHorizontal className="size-4" />
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Film}
          title="No videos match"
          description="Try a different search term or clear the status filter."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery('')
                setFilter('All')
              }}
            >
              Clear filters
            </Button>
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
                <TableHead>Engagement</TableHead>
                <TableHead>Uploaded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <Link
                      to={`/dashboard/videos/${v.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <span className={cn(
                        'grid h-10 w-[72px] shrink-0 place-items-center overflow-hidden rounded-[10px] border font-mono text-[9px] font-semibold transition-colors',
                        v.status === 'ready'
                          ? 'border-primary/20 bg-primary/8 text-primary'
                          : v.status === 'processing'
                          ? 'border-warning/20 bg-warning/8 text-warning'
                          : v.status === 'failed'
                          ? 'border-destructive/20 bg-destructive/8 text-destructive'
                          : 'border-[var(--glass-border)] bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)] text-muted-foreground',
                      )}>
                        {v.renditions.at(-1) ?? <Film className="size-3.5 opacity-40" />}
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-1 font-medium transition-colors group-hover:text-primary">
                          {v.title}
                        </span>
                        <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                          {v.id}
                          {v.transcript && ' · transcript'}
                        </span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusPill status={v.status} progress={v.progress} />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {formatDuration(v.duration)}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {formatBytes(v.size)}
                  </TableCell>
                  <TableCell>
                    {v.status === 'ready' ? (
                      <span className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Eye className="size-3" />
                          {v.views.toLocaleString()}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessagesSquare className="size-3" />
                          {v.questions}
                        </span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDate(v.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t border-[var(--glass-border)] px-4 py-3">
            <p className="font-mono text-[11px] text-muted-foreground">
              Showing {rows.length} of {videos.length}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
