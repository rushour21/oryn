import { Link } from 'react-router'
import { Mesh, Glass } from '@/components/dashboard/glass'
import { LogoMark } from '@/components/brand/Logo'
import { cn } from '@/lib/utils'

/** Centred glass card on the ambient mesh — the frame for every auth screen. */
export function AuthShell({ title, description, children, footer, className }) {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      <Mesh />

      <div className="relative z-10 w-full max-w-[420px]">
        <Link to="/" className="mb-7 flex items-center justify-center gap-2.5">
          <LogoMark />
          <span className="font-display text-[19px] font-bold tracking-tight">ORYN</span>
        </Link>

        <Glass className={cn('p-7 sm:p-8', className)}>
          <h1 className="font-display text-[22px] font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
          )}
          <div className="mt-6">{children}</div>
        </Glass>

        {footer && (
          <p className="mt-5 text-center text-sm text-muted-foreground">{footer}</p>
        )}
      </div>
    </div>
  )
}

/** Inline form-level error banner. */
export function FormError({ children }) {
  if (!children) return null
  return (
    <div
      role="alert"
      className="rounded-[14px] border border-destructive/25 bg-destructive/8 px-3.5 py-2.5 text-sm text-destructive"
    >
      {children}
    </div>
  )
}

/** Per-field validation message. */
export function FieldError({ children }) {
  if (!children) return null
  return <p className="mt-1.5 text-xs text-destructive">{children}</p>
}
