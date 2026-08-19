import { api } from './client'

export const videosApi = {
  list: ({ status, limit = 50, offset = 0 } = {}) => {
    const q = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    if (status && status !== 'all') q.set('status', status)
    return api.get(`/api/videos?${q}`)
  },

  get: (id) => api.get(`/api/videos/${id}`),

  /** Creates the record and opens the multipart upload in one call. */
  create: ({ filename, size, contentType, title, description, language }) =>
    api.post('/api/videos', {
      filename,
      size,
      content_type: contentType,
      ...(title && { title }),
      ...(description && { description }),
      ...(language && { language }),
    }),

  signParts: (id, partNumbers) =>
    api.post(`/api/videos/${id}/parts`, { part_numbers: partNumbers }),

  listParts: (id) => api.get(`/api/videos/${id}/parts`),

  complete: (id, parts) => api.post(`/api/videos/${id}/complete`, { parts }),

  abort: (id) => api.post(`/api/videos/${id}/abort`),

  remove: (id) => api.delete(`/api/videos/${id}`),

  getTranscript: (id) => api.get(`/api/videos/${id}/transcript`),

  /** Per-step processing history — powers the Processing tab. */
  getPipeline: (id) => api.get(`/api/videos/${id}/pipeline`),
}
