import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { LogoMark } from '@/components/brand/Logo'
import { refreshSession } from '@/lib/api/client'
import { useAuthStore } from '@/stores/auth'

/**
 * Landing point for the Google OAuth redirect.
 *
 * The callback arrives as /auth/callback#access_token=… but we ignore that value
 * and exchange the httpOnly cookie instead: one request returns the profile as
 * well as a token, and nothing sensitive is read out of the URL. The fragment is
 * stripped from history straight away regardless, so the token cannot leak via
 * the back button or a shared URL.
 */
export default function OAuthCallback() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const clearSession = useAuthStore((s) => s.clearSession)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    window.history.replaceState(null, '', window.location.pathname)

    refreshSession()
      .then((session) => {
        setSession(session)
        navigate('/dashboard', { replace: true })
      })
      .catch(() => {
        clearSession()
        navigate('/login?error=oauth', { replace: true })
      })
  }, [navigate, setSession, clearSession])

  return (
    <div className="grid min-h-dvh place-items-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <LogoMark className="size-9 animate-pulse" />
        <p className="text-sm text-muted-foreground">Signing you in…</p>
      </div>
    </div>
  )
}
