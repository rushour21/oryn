import { api } from './client'

/**
 * Auth endpoints.
 *
 * Responses never carry a refresh token — it arrives as an httpOnly cookie the
 * browser stores on our behalf. Everything here returns `{ user, orgs, org,
 * accessToken }` or a plain message.
 */
export const authApi = {
  signup: ({ name, email, password, orgName }) =>
    api.post('/api/auth/signup', { name, email, password, org_name: orgName }, { auth: false }),

  login: ({ email, password, orgId }) =>
    api.post('/api/auth/login', { email, password, ...(orgId && { org_id: orgId }) }, { auth: false }),

  logout: () => api.post('/api/auth/logout', undefined, { auth: false }),

  me: () => api.get('/api/auth/me'),

  verifyEmail: (token) =>
    api.post('/api/auth/verify-email', { token }, { auth: false }),

  resendVerification: () => api.post('/api/auth/verify-email/resend'),

  /** Dev-only: skips the emailed link. Backend 404s this outside dev, so the button that calls it is import.meta.env.DEV-gated too — belt and suspenders. */
  devBypassVerify: () => api.post('/api/auth/verify-email/dev-bypass'),

  forgotPassword: (email) =>
    api.post('/api/auth/forgot-password', { email }, { auth: false }),

  resetPassword: ({ token, password }) =>
    api.post('/api/auth/reset-password', { token, password }, { auth: false }),

  acceptInvite: ({ token, name, password }) =>
    api.post('/api/auth/accept-invite', { token, name, password }, { auth: false }),
}

export const googleAuthUrl = () =>
  `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/api/auth/google`
