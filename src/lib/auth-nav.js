/**
 * Where a signed-in user belongs, and how to trust a ?next= value.
 *
 * Both the imperative post-login navigate() and PublicOnlyRoute's declarative
 * redirect derive their target from here. The two race by design — setSession
 * flips status to 'authenticated', re-rendering PublicOnlyRoute in the same tick
 * as the navigate() call — so the only way to get a predictable landing is for
 * both to compute it identically rather than trying to order them.
 */
export function postAuthLanding(user) {
  return user?.email_verified ? '/dashboard' : '/verify-email'
}

/**
 * Only same-origin paths survive. `//evil.com` is a protocol-relative URL the
 * browser treats as absolute, so rejecting a leading `//` is what stops this
 * being an open redirect.
 */
export function safeNext(raw) {
  if (!raw) return null
  let path
  try {
    path = decodeURIComponent(raw)
  } catch {
    return null
  }
  return path.startsWith('/') && !path.startsWith('//') ? path : null
}
