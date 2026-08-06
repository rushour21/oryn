/**
 * Placeholder data for the Phase 1 dashboard UI.
 * Replace each export with a call to the internal API
 * (GET /api/videos, /api/usage, …) once the backend lands.
 */

export const STATUS = {
  ready: { label: 'Ready', variant: 'success' },
  processing: { label: 'Processing', variant: 'warning' },
  uploading: { label: 'Uploading', variant: 'default' },
  failed: { label: 'Failed', variant: 'destructive' },
}

export const videos = [
  {
    id: 'vid_9k2m',
    title: 'Lecture 12 — Thermodynamics & Entropy',
    status: 'ready',
    duration: 2412,
    size: 1_884_901_376,
    createdAt: '2026-08-04T09:12:00Z',
    renditions: ['360p', '480p', '720p', '1080p'],
    transcript: true,
    questions: 348,
    views: 1284,
  },
  {
    id: 'vid_7f4a',
    title: 'Lecture 11 — The First Law',
    status: 'ready',
    duration: 2180,
    size: 1_610_612_736,
    createdAt: '2026-08-03T14:40:00Z',
    renditions: ['360p', '480p', '720p', '1080p'],
    transcript: true,
    questions: 291,
    views: 1102,
  },
  {
    id: 'vid_3c81',
    title: 'Organic Chemistry — Reaction Mechanisms',
    status: 'processing',
    duration: 3305,
    size: 2_469_606_195,
    createdAt: '2026-08-06T08:05:00Z',
    renditions: ['360p', '480p'],
    transcript: false,
    questions: 0,
    views: 0,
    progress: 63,
  },
  {
    id: 'vid_1b09',
    title: 'Doubt Session — Week 4 Recap',
    status: 'ready',
    duration: 1520,
    size: 943_718_400,
    createdAt: '2026-08-01T18:22:00Z',
    renditions: ['360p', '480p', '720p'],
    transcript: true,
    questions: 96,
    views: 613,
  },
  {
    id: 'vid_5d77',
    title: 'Integral Calculus — Substitution Method',
    status: 'failed',
    duration: null,
    size: 2_147_483_648,
    createdAt: '2026-08-05T11:30:00Z',
    renditions: [],
    transcript: false,
    questions: 0,
    views: 0,
    error: 'ffprobe: moov atom not found — source file is truncated',
  },
  {
    id: 'vid_8e22',
    title: 'Physics Crash Course — Kinematics',
    status: 'ready',
    duration: 4020,
    size: 3_006_477_107,
    createdAt: '2026-07-28T07:10:00Z',
    renditions: ['360p', '480p', '720p', '1080p'],
    transcript: true,
    questions: 512,
    views: 2077,
  },
]

export const stats = [
  { key: 'videos', label: 'Videos', value: '24', delta: '+6', sub: 'this month' },
  { key: 'storage', label: 'Storage', value: '184 GB', delta: '+22 GB', sub: 'of 500 GB' },
  { key: 'watch', label: 'Watch hours', value: '3,914', delta: '+18%', sub: 'vs last month' },
  { key: 'questions', label: 'AI questions', value: '9,247', delta: '+31%', sub: 'vs last month' },
]

export const quotas = [
  { label: 'Storage', used: 184, total: 500, unit: 'GB' },
  { label: 'Encoding minutes', used: 1740, total: 3000, unit: 'min' },
  { label: 'AI questions', used: 9247, total: 20000, unit: '' },
]

export const checklist = [
  { label: 'Create your organisation', done: true },
  { label: 'Upload your first video', done: true },
  { label: 'Add an allowed domain', done: true },
  { label: 'Embed a player on your site', done: false },
  { label: 'Try Ask AI on a lecture', done: false },
]

export const pipelineSteps = [
  { name: 'Inspect source', status: 'done', ms: 3800, detail: '1920×1080 · h264 · 30fps · 6.2 Mbps' },
  { name: 'Transcode ladder', status: 'done', ms: 486000, detail: '4 renditions · 1,206 segments' },
  { name: 'Encrypt segments', status: 'done', ms: 41200, detail: 'aes-128-cbc · key wrapped' },
  { name: 'Extract audio', status: 'done', ms: 9400, detail: '16 kHz mono wav' },
  { name: 'Transcribe', status: 'done', ms: 178000, detail: 'whisper-large-v3 · en · 6,142 words' },
  { name: 'Build transcript index', status: 'done', ms: 1900, detail: '41 chunks · 15s overlap' },
]

export const transcriptChunks = [
  { id: 'c0', start: 0, text: 'Welcome to lecture twelve. Today we finish the second law and move into entropy properly.' },
  { id: 'c1', start: 62, text: 'Before that, a quick recap of the first law — energy is conserved, but that alone does not tell us which direction a process runs in.' },
  { id: 'c14', start: 862, text: 'Entropy is a measure of how spread out the energy in a system is. I like to describe it as disorder you cannot get back.' },
  { id: 'c17', start: 1043, text: 'Take the ice melting in a warm room. Energy flows from the room into the ice, and it never spontaneously flows back.' },
  { id: 'c33', start: 1980, text: 'For the exam, you need the second law statement and entropy change calculations. The statistical derivation is optional reading.' },
]

export const domains = [
  { id: 1, domain: 'myacademy.com', addedAt: '2026-07-12T00:00:00Z' },
  { id: 2, domain: 'www.myacademy.com', addedAt: '2026-07-12T00:00:00Z' },
  { id: 3, domain: 'courses.myacademy.com', addedAt: '2026-07-30T00:00:00Z' },
]
