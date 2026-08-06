import { Badge } from '@/components/ui/badge'
import { STATUS } from '@/data/mock'
import { cn } from '@/lib/utils'

export function PageHeader({ title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 pb-2 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function StatusPill({ status, progress }) {
  const s = STATUS[status] ?? STATUS.ready
  return (
    <Badge variant={s.variant} className="gap-1.5">
      <span
        className={cn(
          'size-1.5 rounded-full bg-current',
          (status === 'processing' || status === 'uploading') &&
            'animate-[shimmer_1.6s_ease-in-out_infinite]',
        )}
      />
      {s.label}
      {progress != null && status === 'processing' && ` ${progress}%`}
    </Badge>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-20 text-center">
      {Icon && (
        <span className="mb-5 grid size-12 place-items-center rounded-xl border border-border bg-secondary">
          <Icon className="size-5 text-muted-foreground" />
        </span>
      )}
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
