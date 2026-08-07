import { useState } from 'react'
import { Link } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { AuthShell, FormError, FieldError } from '@/components/auth/AuthShell'
import { authApi } from '@/lib/api/auth'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const forgot = useMutation({ mutationFn: authApi.forgotPassword })

  // The API answers 200 whether or not the address exists, so the UI must not
  // reveal anything either — same confirmation both ways.
  if (forgot.isSuccess) {
    return (
      <AuthShell
        title="Check your inbox"
        description={`If an account exists for ${email}, a reset link is on its way.`}
        footer={
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        }
      >
        <div className="flex items-start gap-3 rounded-[14px] border border-[var(--glass-border)] px-4 py-3.5">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            The link expires in one hour. Check your spam folder if it hasn&apos;t
            arrived in a few minutes.
          </p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Reset your password"
      description="We'll email you a link to set a new one."
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          forgot.mutate(email)
        }}
      >
        {forgot.error && !forgot.error.fieldErrors && <FormError>{forgot.error.message}</FormError>}

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            autoFocus
            className="mt-1.5"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FieldError>{forgot.error?.fieldErrors?.email?.[0]}</FieldError>
        </div>

        <Button type="submit" className="w-full" disabled={forgot.isPending}>
          {forgot.isPending ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
    </AuthShell>
  )
}
