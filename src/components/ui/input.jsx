import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

function Input({ className, type = 'text', ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-10 w-full min-w-0 rounded-full border border-[var(--glass-border)] bg-transparent px-4 py-2 text-sm',
        'placeholder:text-muted-foreground/70 transition-colors',
        'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

/**
 * Password field with a reveal toggle.
 *
 * The toggle is `type="button"` inside a relatively-positioned wrapper rather
 * than a sibling element, so it sits inline over the field without disturbing
 * form layout or grabbing tab order ahead of the actual input.
 */
function PasswordInput({ className, id, ...props }) {
  const [visible, setVisible] = useState(false)
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className="relative">
      <Input
        id={inputId}
        type={visible ? 'text' : 'password'}
        className={cn('pr-11', className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-controls={inputId}
        tabIndex={-1}
        className="absolute inset-y-0 right-1 flex items-center px-2.5 text-muted-foreground/70 transition-colors hover:text-foreground"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

function Textarea({ className, ...props }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-20 w-full rounded-[20px] border border-[var(--glass-border)] bg-transparent px-4 py-3 text-sm',
        'placeholder:text-muted-foreground/70 transition-colors resize-y',
        'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

function Label({ className, ...props }) {
  return (
    <label
      className={cn(
        'text-sm font-medium leading-none text-foreground select-none',
        className,
      )}
      {...props}
    />
  )
}

export { Input, PasswordInput, Textarea, Label }
