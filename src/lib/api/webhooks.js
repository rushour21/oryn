import { api } from './client'

/** The five events the API emits (PRD F16). An empty selection means all of them. */
export const WEBHOOK_EVENTS = [
  { id: 'video.uploaded',   label: 'Upload received',   hint: 'The file is in our storage.' },
  { id: 'video.processing', label: 'Processing started', hint: 'A worker picked it up.' },
  { id: 'video.ready',      label: 'Ready to play',      hint: 'The one most integrations act on.' },
  { id: 'video.failed',     label: 'Processing failed',  hint: 'Sent once, after retries are exhausted.' },
  { id: 'transcript.ready', label: 'Transcript ready',   hint: 'Captions and Ask AI are live.' },
]

export const webhooksApi = {
  list: () => api.get('/api/webhooks'),

  /** Returns the signing secret exactly once, in the create response. */
  create: ({ url, events }) => api.post('/api/webhooks', { url, events }),

  update: (id, patch) => api.patch(`/api/webhooks/${id}`, patch),

  remove: (id) => api.delete(`/api/webhooks/${id}`),
}
