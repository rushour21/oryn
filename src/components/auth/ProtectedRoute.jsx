import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router'
import { useAuthStore } from '@/stores/auth'
import { postAuthLanding, safeNext } from '@/lib/auth-nav'

/**
 * Route guard.
 *
 * Two levels, because the PRD gates uploading (not the whole dashboard) behind a
 * verified email: an unverified owner should still be able to look around and
 * invite their team.
 *
 * @param {boolean} [requireVerified=false] Also demand a verified email address.
 */
export function ProtectedRoute({ requireVerified = false }) {
  const status = useAuthStore((s) => s.status)
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (status === 'loading') return null // AuthBootstrap owns the splash

  if (status !== 'authenticated') {
    // Remember where they were headed so login can send them back.
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }

  if (requireVerified && !user?.email_verified) {
    return <Navigate to="/verify-email" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

/** Inverse guard — keeps signed-in users off /login and /signup. */
export function PublicOnlyRoute() {
  const status = useAuthStore((s) => s.status)
  const user = useAuthStore((s) => s.user)
  const [params] = useSearchParams()

  if (status === 'loading') return null

  if (status === 'authenticated') {
    // Honour ?next= so a deep link survives the sign-in detour.
    return <Navigate to={safeNext(params.get('next')) ?? postAuthLanding(user)} replace />
  }

  return <Outlet />
}
