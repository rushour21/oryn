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

  isVerified: () => Boolean(get().user?.email_verified),
}))

// The transport layer cannot import this store (it must stay framework-free), so
// the wiring is inverted: the store hands the client a callback instead.
onSessionExpired(() => {
  useAuthStore.getState().clearSession()
})
