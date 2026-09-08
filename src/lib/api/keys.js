import { api } from './client'

/**
 * Developer API keys (PRD F12). Dashboard-only — a customer manages keys with
 * their own login, never with another key, so every call here goes through the
 * session Bearer token like the rest of the dashboard.
 */
export const keysApi = {
  list: () => api.get('/api/keys'),

  create: ({ name, type }) => api.post('/api/keys', { name, type }),

  /** Issues a replacement and starts the old key's grace period. */
  rotate: (id) => api.post(`/api/keys/${id}/rotate`),

  /** Immediate, unlike rotation — this is the "it leaked" button. */
  revoke: (id) => api.delete(`/api/keys/${id}`),
}
