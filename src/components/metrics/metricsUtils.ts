import type { MetricSeries } from '@/lib/types'

export const FIVE_MIN_MS = 5 * 60 * 1000

export const getSeriesLast = (series?: MetricSeries) =>
  series ? (series.points[series.points.length - 1]?.value ?? 0) : 0

export function sliceLast5Min(points: MetricSeries['points']) {
  if (points.length === 0) return points
  const cutoff = points[points.length - 1].ts - FIVE_MIN_MS
  const idx = points.findIndex(p => p.ts >= cutoff)
  return idx === -1 ? points : points.slice(idx)
}

export function filterByEnv(s: MetricSeries, envFilter: string) {
  if (envFilter === 'all') return true
  const env = (s as MetricSeries & { env?: string }).env
  if (!env) return false
  return env === envFilter
}
