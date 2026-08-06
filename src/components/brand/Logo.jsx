import { Link } from 'react-router'
import { cn } from '@/lib/utils'

export function LogoMark({ className }) {
  return (
    <img
      src="/oryn-logo.png"
      alt=""
      width={28}
      height={28}
      className={cn('size-7 select-none', className)}
      draggable={false}
    />
  )
}

export function Logo({ className, to = '/', showWord = true }) {
  return (
    <Link to={to} className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      {showWord && (
        <span className="font-display text-[19px] font-bold tracking-tight">
          ORYN
        </span>
      )}
    </Link>
  )
}
