import { api } from './client'

export const usageApi = {
  /** This billing period's totals for all five metered units, against plan limits. */
  summary: () => api.get('/api/usage'),

  /** Daily totals for one metric, for the chart. */
  series: ({ metric, days = 30 }) =>
    api.get(`/api/usage/series?${new URLSearchParams({ metric, days: String(days) })}`),
}
