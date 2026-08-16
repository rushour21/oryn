import { useQuery } from '@tanstack/react-query'
import { videosApi } from '@/lib/api/videos'
import { isActive } from '@/lib/video-progress'

const POLL_MS = 2000

/**
 * Watches one video while the pipeline works on it.
 *
 * Polling stops on its own once the video reaches a terminal state —
 * refetchInterval returning false is what ends it, so a finished video costs
 * nothing and a tab left open overnight does not hammer the API.
 *
 * @param {string|null} videoId  Pass null to disable entirely.
 */
export function useVideoStatus(videoId, { enabled = true } = {}) {
  const query = useQuery({
    queryKey: ['video', videoId],
    queryFn: () => videosApi.get(videoId),
    enabled: Boolean(videoId) && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.video?.status
      // No data yet means the first request is still in flight — keep the timer
      // armed rather than concluding the job is finished.
      if (!status) return POLL_MS
      return isActive(status) ? POLL_MS : false
    },
    // Encoding progresses whether or not the tab is focused. Without this,
    // switching away freezes the bar and the user returns to a stale reading —
    // TanStack Query suspends interval refetching in hidden documents by default.
    refetchIntervalInBackground: true,
    // The pipeline writes progress continuously; anything cached is stale.
    staleTime: 0,
  })

  return {
    video: query.data?.video ?? null,
    isPolling: query.isFetching,
    error: query.error,
  }
}
