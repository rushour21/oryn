import { useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { MailCheck, CheckCircle2, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthShell, FormError } from '@/components/auth/AuthShell'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/stores/auth'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const patchUser = useAuthStore((s) => s.patchUser)
  const isAuthed = useAuthStore((s) => s.status === 'authenticated')
  const token = params.get('token')

  const verify = useMutation({
    mutationFn: authApi.verifyEmail,
    onSuccess: () => {
      patchUser({ email_verified: true })
      // Verification links are often opened in a different browser from the one
      // that signed up, so there may be no session to continue into.
      setTimeout(() => navigate(isAuthed ? '/dashboard' : '/login', { replace: true }), 1200)
    },
  })

  const resend = useMutation({ mutationFn: authApi.resendVerification })

  // Local dev only: SMTP isn't wired to a real inbox yet, so this skips the
  // emailed link entirely. Gated on the Vite dev build so the button — and the
  // authApi call it makes — never ship in a production bundle; the backend
  // route is separately hard-gated on NODE_ENV, so this is belt and suspenders.
  const devVerify = useMutation({
    mutationFn: authApi.devBypassVerify,
    onSuccess: () => {
      patchUser({ email_verified: true })
      navigate('/dashboard', { replace: true })
    },
  })

  // Auto-submit when arriving from the emailed link. The ref guards against
  // StrictMode's double effect burning the single-use token on the first render.
  const attempted = useRef(false)
  useEffect(() => {
    if (token && !attempted.current) {
      attempted.current = true
      verify.mutate(token)
    }
  }, [token, verify])

  if (verify.isSuccess) {
    return (
      <AuthShell
        title="Email verified"
        description={isAuthed ? 'Taking you to your dashboard…' : 'Taking you to sign in…'}
      >
        <div className="flex items-center gap-3 rounded-[14px] border border-primary/25 bg-primary/8 px-4 py-3">
          <CheckCircle2 className="size-5 shrink-0 text-primary" />
          <p className="text-sm">You&apos;re all set — uploads are unlocked.</p>
        </div>
      </AuthShell>
    )
  }

  // Arrived with a token: show progress / failure rather than the inbox prompt.
  if (token) {
    return (
      <AuthShell
        title={verify.isPending ? 'Verifying…' : 'Verification failed'}
        description={
          verify.isPending
            ? 'Confirming your email address.'
            : 'That link is invalid or has expired.'
        }
      >
        {verify.error && (
          <div className="space-y-4">
            <FormError>{verify.error.message}</FormError>
            {/* Resending needs a session — the endpoint derives the address from
                the bearer token rather than trusting one from the form. */}
            {isAuthed ? (
              <Button
                className="w-full"
                disabled={resend.isPending || resend.isSuccess}
                onClick={() => resend.mutate()}
              >
                {resend.isSuccess ? 'New link sent' : resend.isPending ? 'Sending…' : 'Send a new link'}
              </Button>
            ) : (
              <Button className="w-full" asChild>
                <Link to="/login">Sign in to resend</Link>
              </Button>
            )}
            {import.meta.env.DEV && isAuthed && <DevBypassButton mutation={devVerify} />}
          </div>
        )}
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Check your inbox"
      description={
        user?.email
          ? `We sent a verification link to ${user.email}.`
          : 'We sent you a verification link.'
      }
      footer={
        isAuthed ? (
          <Link to="/dashboard" className="font-medium text-primary hover:underline">
            Skip for now
          </Link>
        ) : (
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        )
      }
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-[14px] border border-[var(--glass-border)] px-4 py-3.5">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            Click the link in that email to unlock video uploads. You can explore the
            dashboard in the meantime.
          </p>
        </div>

        {resend.error && <FormError>{resend.error.message}</FormError>}

        {isAuthed && (
          <Button
            variant="outline"
            className="w-full"
            disabled={resend.isPending || resend.isSuccess}
            onClick={() => resend.mutate()}
          >
            {resend.isSuccess ? 'Email sent' : resend.isPending ? 'Sending…' : 'Resend email'}
          </Button>
        )}

        {import.meta.env.DEV && isAuthed && <DevBypassButton mutation={devVerify} />}
      </div>
    </AuthShell>
  )
}

/** Local-dev-only escape hatch — see the devVerify mutation above for why this exists. */
function DevBypassButton({ mutation }) {
  return (
    <div className="space-y-2 border-t border-dashed border-[var(--glass-border)] pt-4">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <FlaskConical className="size-3" /> Dev only
      </p>
      {mutation.error && <FormError>{mutation.error.message}</FormError>}
      <Button
        variant="ghost"
        className="w-full border border-dashed border-[var(--glass-border)] text-muted-foreground hover:text-foreground"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? 'Verifying…' : 'Skip email — verify instantly'}
      </Button>
    </div>
  )
}
