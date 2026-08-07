import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { AuthShell, FormError, FieldError } from '@/components/auth/AuthShell'
import { authApi } from '@/lib/api/auth'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const reset = useMutation({
    mutationFn: authApi.resetPassword,
    // Resetting revokes every session server-side, so there is nothing to carry
    // over — send them to a clean sign-in.
    onSuccess: () => navigate('/login?reset=1', { replace: true }),
  })

  const mismatch = confirm.length > 0 && password !== confirm

  if (!token) {
    return (
      <AuthShell
        title="Link incomplete"
        description="This reset link is missing its token."
        footer={
          <Link to="/forgot-password" className="font-medium text-primary hover:underline">
            Request a new link
          </Link>
        }
      >
        <FormError>Open the link directly from your email, or request a new one.</FormError>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Set a new password"
      description="You'll be signed out everywhere else."
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
          if (mismatch) return
          reset.mutate({ token, password })
        }}
      >
        {reset.error && !reset.error.fieldErrors && <FormError>{reset.error.message}</FormError>}

        <div>
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            autoFocus
            className="mt-1.5"
            value={password}
            aria-invalid={Boolean(reset.error?.fieldErrors?.password)}
            onChange={(e) => setPassword(e.target.value)}
          />
          <FieldError>{reset.error?.fieldErrors?.password?.[0]}</FieldError>
          <p className="mt-1.5 text-xs text-muted-foreground">At least 8 characters.</p>
        </div>

        <div>
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            className="mt-1.5"
            value={confirm}
            aria-invalid={mismatch}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <FieldError>{mismatch ? 'Passwords do not match.' : null}</FieldError>
        </div>

        <Button type="submit" className="w-full" disabled={reset.isPending || mismatch}>
          {reset.isPending ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </AuthShell>
  )
}
