import { useEffect } from 'react'
import { LogoMark } from '@/components/brand/Logo'
import { refreshSession } from '@/lib/api/client'
import { useAuthStore } from '@/stores/auth'

/**
 * Rehydrates the session before the router renders.
 *
 * The access token is memory-only, so every hard reload starts logged out. This
 * trades the httpOnly refresh cookie for a fresh access token + profile in one
 * request. Without it, refreshing the page on /dashboard would bounce a
 * perfectly valid session to /login.
 *
 * StrictMode double-invokes this effect in dev; the single-flight guard inside
 * refreshSession() collapses that into one network call.
 */
export function AuthBootstrap({ children }) {
  const status = useAuthStore((s) => s.status)
  const setSession = useAuthStore((s) => s.setSession)
  const clearSession = useAuthStore((s) => s.clearSession)

  useEffect(() => {
    let cancelled = false

    refreshSession()
      .then((session) => {
        if (!cancelled) setSession(session)
      })
      .catch(() => {
        // 401 here is the normal "not logged in" path, not an error worth surfacing.
        if (!cancelled) clearSession()
      })

    return () => {
      cancelled = true
    }
  }, [setSession, clearSession])

  if (status === 'loading') return <BootSplash />
  return children
}

function BootSplash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <LogoMark className="size-9 animate-pulse" />
        <span className="sr-only">Loading your session…</span>
      </div>
    </div>
  )
}
