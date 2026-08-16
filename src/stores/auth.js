import { create } from 'zustand'
import { setAccessToken, onSessionExpired } from '@/lib/api/client'

/**
 * Client-side auth state.
 *
 * Holds the access token in memory only — never localStorage, so an XSS payload
 * cannot exfiltrate a long-lived credential. The cost is that a page reload
 * starts with no token; `AuthBootstrap` trades the httpOnly refresh cookie for a
 * fresh one before the router renders.
 *
 * This store never holds server data (videos, members, usage). That lives in the
 * TanStack Query cache so there is exactly one source of truth per resource.
 */
export const useAuthStore = create((set, get) => ({
  /** 'loading' until the boot refresh settles, then 'authenticated' | 'anonymous'. */
  status: 'loading',
  user: null,
  orgs: [],
  activeOrg: null,

  setSession: ({ user, orgs = [], org = null, accessToken }) => {
    setAccessToken(accessToken)
    set({
      status: 'authenticated',
      user,
      orgs,
      activeOrg: org ?? orgs[0] ?? null,
    })
  },

  clearSession: () => {
    setAccessToken(null)
    set({ status: 'anonymous', user: null, orgs: [], activeOrg: null })
  },

  setActiveOrg: (orgId) =>
    set((s) => ({ activeOrg: s.orgs.find((o) => o.id === orgId) ?? s.activeOrg })),

  /** Local patch after a mutation (e.g. email_verified flips true). */
  patchUser: (patch) =>
    set((s) => ({ user: s.user ? { ...s.user, ...patch } : s.user })),

  /**
   * Local patch after renaming the org (Settings → General).
   *
   * `activeOrg`/`orgs` are session identity, not a paginated resource, so they
   * live here rather than in the query cache — same reasoning as `user` above.
   * Settings' own org query stays the source of truth for the form; this just
   * keeps the rail/header in sync without forcing a re-login to see the change.
   */
  patchActiveOrg: (patch) =>
    set((s) => ({
      activeOrg: s.activeOrg ? { ...s.activeOrg, ...patch } : s.activeOrg,
      orgs: s.orgs.map((o) => (o.id === s.activeOrg?.id ? { ...o, ...patch } : o)),
    })),

  isVerified: () => Boolean(get().user?.email_verified),
}))

// The transport layer cannot import this store (it must stay framework-free), so
// the wiring is inverted: the store hands the client a callback instead.
onSessionExpired(() => {
  useAuthStore.getState().clearSession()
})
