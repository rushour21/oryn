/**
 * One continuous 0-100 bar spanning upload *and* processing.
 *
 * The two halves are measured by different things — bytes sent from the browser,
 * then pipeline stages reported by the server — so they are mapped onto a fixed
 * split rather than a "smart" ratio. Upload speed depends on the network and
 * processing on video length, so any predicted ratio would be wrong most of the
 * time and make the bar jump backwards. A fixed split never regresses.
 */
const UPLOAD_SHARE = 0.5;

export const PHASE = {
  IDLE: 'idle',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  READY: 'ready',
  FAILED: 'failed',
}

/** Server statuses that mean the pipeline is still working. */
export const ACTIVE_STATUSES = new Set(['created', 'uploading', 'uploaded', 'processing'])

export function isActive(status) {
  return ACTIVE_STATUSES.has(status)
}

/**
 * Combines client upload progress with server pipeline progress.
 *
 * @param {object} args
 * @param {string} args.phase        One of PHASE
 * @param {number} [args.uploadPercent]   0-100, from the browser
 * @param {number} [args.serverProgress]  0-100, from videos.progress
 * @returns {{ percent: number, label: string, indeterminate: boolean }}
 */
export function combinedProgress({ phase, uploadPercent = 0, serverProgress = 0 }) {
  switch (phase) {
    case PHASE.UPLOADING:
      return {
        percent: clamp(uploadPercent * UPLOAD_SHARE),
        label: 'Uploading',
        indeterminate: false,
      }

    case PHASE.PROCESSING:
      return {
        percent: clamp(UPLOAD_SHARE * 100 + serverProgress * (1 - UPLOAD_SHARE)),
        label: 'Processing',
        // The server reports 0 until the first stage writes progress; showing a
        // frozen bar there reads as a hang, so flag it for a pulsing treatment.
        indeterminate: serverProgress === 0,
      }

    case PHASE.READY:
      return { percent: 100, label: 'Ready', indeterminate: false }

    case PHASE.FAILED:
      return { percent: 100, label: 'Failed', indeterminate: false }

    default:
      return { percent: 0, label: '', indeterminate: false }
  }
}

/** Maps a server video row to a phase, for rows the client didn't upload itself. */
export function phaseForStatus(status) {
  if (status === 'ready') return PHASE.READY
  if (status === 'failed') return PHASE.FAILED
  if (status === 'uploading' || status === 'created') return PHASE.UPLOADING
  return PHASE.PROCESSING
}

const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)))
