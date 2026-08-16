import { Progress } from '@/components/ui/misc'
import { combinedProgress, PHASE } from '@/lib/video-progress'
import { cn } from '@/lib/utils'

/**
 * The single upload-through-processing bar.
 *
 * Used by both the upload page and the library rows so the two can never drift
 * apart in how a percentage is presented.
 */
export function VideoProgress({
  phase,
  uploadPercent = 0,
  serverProgress = 0,
  detail,
  meta,
  className,
  compact = false,
}) {
  const { percent, label, indeterminate } = combinedProgress({
    phase,
    uploadPercent,
    serverProgress,
  })

  if (phase === PHASE.IDLE) return null

  const failed = phase === PHASE.FAILED
  const ready = phase === PHASE.READY

  return (
    <div className={className}>
      <Progress
        value={percent}
        className={cn(compact ? 'h-1' : 'h-1.5', indeterminate && 'animate-pulse')}
        indicatorClassName={cn(
          failed && 'bg-destructive bg-none',
          ready && 'bg-primary bg-none',
        )}
      />

      <div
        className={cn(
          'mt-2 flex items-center justify-between gap-3 font-mono text-[11px]',
          compact && 'mt-1.5 text-[10px]',
        )}
      >
        <span
          className={cn(
            'truncate',
            failed ? 'text-destructive' : ready ? 'text-primary' : 'text-primary',
          )}
        >
          {label}
          {!ready && !failed && '…'}
          {detail && <span className="ml-1.5 text-muted-foreground">{detail}</span>}
        </span>

        <span className="shrink-0 tabular-nums text-muted-foreground">
          {failed ? '—' : `${percent}%`}
          {meta && <span className="ml-1.5">· {meta}</span>}
        </span>
      </div>
    </div>
  )
}
