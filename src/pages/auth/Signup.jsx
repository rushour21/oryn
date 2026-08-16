import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input, PasswordInput, Label } from '@/components/ui/input'
import { AuthShell, FormError, FieldError } from '@/components/auth/AuthShell'
import { postAuthLanding } from '@/lib/auth-nav'
import { authApi, googleAuthUrl } from '@/lib/api/auth'
import { useAuthStore } from '@/stores/auth'

export default function Signup() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const [form, setForm] = useState({ name: '', email: '', password: '', orgName: '' })

  const signup = useMutation({
    mutationFn: authApi.signup,
    onSuccess: (session) => {
      setSession(session)
      // A fresh account is always unverified, so this lands on /verify-email —
      // the account exists but uploads stay locked until the emailed link is used.
      navigate(postAuthLanding(session.user), { replace: true })
    },
  })

  const field = (name) => signup.error?.fieldErrors?.[name]?.[0]

  return (
    <AuthShell
      title="Create your account"
      description="Start hosting secure, AI-searchable lectures."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          signup.mutate(form)
        }}
      >
        {signup.error && !signup.error.fieldErrors && <FormError>{signup.error.message}</FormError>}

        <div>
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            autoComplete="name"
            required
            autoFocus
            className="mt-1.5"
            value={form.name}
            aria-invalid={Boolean(field('name'))}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <FieldError>{field('name')}</FieldError>
        </div>

        <div>
          <Label htmlFor="orgName">Academy name</Label>
          <Input
            id="orgName"
            required
            placeholder="My Academy"
            className="mt-1.5"
            value={form.orgName}
            aria-invalid={Boolean(field('org_name'))}
            onChange={(e) => setForm({ ...form, orgName: e.target.value })}
          />
          <FieldError>{field('org_name')}</FieldError>
        </div>

        <div>
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1.5"
            value={form.email}
            aria-invalid={Boolean(field('email'))}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <FieldError>{field('email')}</FieldError>
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="mt-1.5"
            value={form.password}
            aria-invalid={Boolean(field('password'))}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <FieldError>{field('password')}</FieldError>
          <p className="mt-1.5 text-xs text-muted-foreground">At least 8 characters.</p>
        </div>

        <Button type="submit" className="w-full" disabled={signup.isPending}>
          {signup.isPending ? 'Creating account…' : 'Create account'}
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
