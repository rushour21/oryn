import { api } from './client'

export const orgApi = {
  get: () => api.get('/api/org'),

  update: ({ name, slug }) =>
    api.patch('/api/org', { ...(name && { name }), ...(slug && { slug }) }),

  listMembers: () => api.get('/api/org/members'),

  updateMemberRole: (memberId, role) =>
    api.patch(`/api/org/members/${memberId}/role`, { role }),

  removeMember: (memberId) => api.delete(`/api/org/members/${memberId}`),

  listInvitations: () => api.get('/api/org/invitations'),

  invite: ({ email, role }) => api.post('/api/org/invitations', { email, role }),

  cancelInvitation: (id) => api.delete(`/api/org/invitations/${id}`),

  listDomains: () => api.get('/api/org/domains'),

  addDomain: (domain) => api.post('/api/org/domains', { domain }),

  removeDomain: (id) => api.delete(`/api/org/domains/${id}`),
}
