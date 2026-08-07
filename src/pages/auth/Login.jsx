import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { AuthShell, FormError, FieldError } from '@/components/auth/AuthShell'
import { postAuthLanding, safeNext } from '@/lib/auth-nav'
import { authApi, googleAuthUrl } from '@/lib/api/auth'
import { useAuthStore } from '@/stores/auth'

export default function Login() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const setSession = useAuthStore((s) => s.setSession)
  const [form, setForm] = useState({ email: '', password: '' })

  const rawNext = params.get('next')
  const oauthError = params.get('error')
  const justReset = params.get('reset')

  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess: (session) => {
      setSession(session)
      // Same computation PublicOnlyRoute uses — see postAuthLanding on why.
      navigate(safeNext(rawNext) ?? postAuthLanding(session.user), { replace: true })
    },
  })

  const field = (name) => login.error?.fieldErrors?.[name]?.[0]

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to your ORYN dashboard."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          login.mutate(form)
        }}
      >
        {justReset && (
          <div className="rounded-[14px] border border-primary/25 bg-primary/8 px-3.5 py-2.5 text-sm text-primary">
            Password updated. Sign in with your new password.
          </div>
        )}
        {oauthError && <FormError>Google sign-in failed. Try again or use your password.</FormError>}
        {login.error && !login.error.fieldErrors && <FormError>{login.error.message}</FormError>}

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            autoFocus
            className="mt-1.5"
            value={form.email}
            aria-invalid={Boolean(field('email'))}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <FieldError>{field('email')}</FieldError>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1.5"
            value={form.password}
            aria-invalid={Boolean(field('password'))}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <FieldError>{field('password')}</FieldError>
        </div>

        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-[var(--glass-border)]" />
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-[var(--glass-border)]" />
      </div>

      <Button variant="outline" className="w-full" asChild>
        <a href={googleAuthUrl()}>Continue with Google</a>
      </Button>
    </AuthShell>
  )
}
