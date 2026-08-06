import { cn } from '@/lib/utils'

/** Ambient colour mesh — sits behind everything in the dashboard. */
export function Mesh() {
  return (
    <div className="mesh" aria-hidden>
      <span />
      <span />
      <span />
    </div>
  )
}

/** A pane of liquid glass. */
export function Glass({ className, hover = false, as: Tag = 'div', ...props }) {
  return (
    <Tag
      className={cn(
        'glass rounded-[26px]',
        hover && 'glass-hover',
        className,
      )}
      {...props}
    />
  )
}

/**
 * Liquid fill gauge — two sine layers scrolling in opposite directions,
 * with the fill level driven by `value`.
 */
export function WaveGauge({ value = 0, label, caption, className }) {
  const level = Math.max(0, Math.min(100, value))

  return (
    <div
      className={cn(
        'relative flex flex-col justify-end overflow-hidden rounded-[22px]',
        'border border-[var(--glass-border)] bg-[color-mix(in_oklab,var(--primary)_6%,transparent)]',
        className,
      )}
      role="meter"
      aria-valuenow={level}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      {/* liquid */}
      <div
        className="absolute inset-x-0 bottom-0 transition-[height] duration-1000 ease-out"
        style={{ height: `${level}%` }}
      >
        <div className="absolute inset-0 grad-bg opacity-40" />

        {/* two wave crests riding the surface */}
        <svg
          className="absolute -top-[14px] left-0 h-[22px] w-[200%] animate-[wave-1_9s_linear_infinite]"
          viewBox="0 0 1200 40"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M0 22 Q 150 0 300 22 T 600 22 T 900 22 T 1200 22 V40 H0 Z"
            fill="var(--primary)"
            opacity="0.45"
          />
        </svg>
        <svg
          className="absolute -top-[10px] left-0 h-[20px] w-[200%] animate-[wave-2_13s_linear_infinite]"
          viewBox="0 0 1200 40"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M0 20 Q 150 40 300 20 T 600 20 T 900 20 T 1200 20 V40 H0 Z"
            fill="var(--lime)"
            opacity="0.3"
          />
        </svg>
      </div>

      {/* readout */}
      <div className="relative p-5">
        <p className="font-display text-4xl font-medium leading-none tracking-tight">
          {level}
          <span className="text-lg text-muted-foreground">%</span>
        </p>
        <p className="mt-2 text-sm font-medium">{label}</p>
        {caption && (
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
            {caption}
          </p>
        )}
      </div>
    </div>
  )
}

/** Compact sparkline for the smaller tiles. */
export function Spark({ points, className }) {
  const max = Math.max(...points)
  const min = Math.min(...points)
  const span = max - min || 1
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * 100
      const y = 30 - ((p - min) / span) * 26
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      className={cn('h-10 w-full', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L100 32 L0 32 Z`} fill="url(#spark-fill)" />
      <path
        d={d}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="1.6"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/** Radial ring used for the pipeline tile. */
export function Ring({ value = 0, size = 132, stroke = 9, children }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--lime)" />
            <stop offset="55%" stopColor="var(--teal)" />
            <stop offset="100%" stopColor="var(--cyan)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--glass-border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (value / 100) * c}
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div className="absolute grid place-items-center text-center">{children}</div>
    </div>
  )
}
