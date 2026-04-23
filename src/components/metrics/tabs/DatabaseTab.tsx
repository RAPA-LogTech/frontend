'use client'

import { useMemo } from 'react'
import { Box, Paper, Skeleton, Typography, useTheme } from '@mui/material'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { MetricSeries } from '@/lib/types'
import NoDataState from '@/components/common/NoDataState'
import { getSeriesLast, sliceLast5Min } from '../metricsUtils'
import { SectionLabel } from '../MetricsShared'

interface Props {
  metricSeries: MetricSeries[]
  rdsMetrics: MetricSeries[]
  envFilter: string
  isLoading?: boolean
}

const BYTES_PER_MB = 1024 * 1024

function filterSeries(series: MetricSeries[], name: string, envFilter: string) {
  return series.filter(s => {
    if (!s.name.includes(name)) return false
    if (envFilter === 'all') return true
    const env = (s as MetricSeries & { env?: string }).env
    return env ? env === envFilter : false
  })
}

function toMbSeries(series?: MetricSeries): MetricSeries | undefined {
  if (!series) return undefined
  return { ...series, points: series.points.map(p => ({ ...p, value: p.value / BYTES_PER_MB })) }
}

function buildTimeAxis(seriesList: (MetricSeries | undefined)[], limit = 30) {
  const timeSet = new Set<number>()
  seriesList.forEach(s => s?.points.forEach(p => timeSet.add(p.ts)))
  return Array.from(timeSet).sort().slice(-limit)
}

function StatRow({
  label,
  value,
  color,
  sub,
}: {
  label: string
  value: string
  color: string
  sub?: string
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          {label}
        </Typography>
        {sub && (
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', display: 'block', fontSize: 10 }}
          >
            {sub}
          </Typography>
        )}
      </Box>
      <Typography variant="body1" sx={{ fontWeight: 800, color, fontFamily: 'monospace' }}>
        {value}
      </Typography>
    </Box>
  )
}

function MiniLineChart({
  series,
  color,
  height = 60,
}: {
  series: MetricSeries
  color: string
  height?: number
}) {
  const theme = useTheme()
  const points = sliceLast5Min(series.points)
  if (points.length < 2) return <Box sx={{ height }} />
  return (
    <Box sx={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <YAxis hide domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 6,
              fontSize: 11,
            }}
            formatter={v => [Number(v).toFixed(3), '']}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  )
}

export default function DatabaseTab({ metricSeries, rdsMetrics, envFilter, isLoading }: Props) {
  const theme = useTheme()

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Skeleton variant="rounded" height={260} sx={{ flex: 1 }} />
          <Skeleton variant="rounded" height={260} sx={{ flex: '0 0 260px' }} />
        </Box>
        <Skeleton variant="rounded" height={200} />
      </Box>
    )
  }

  const usageSeries = filterSeries(metricSeries, 'db_client_connections_usage', envFilter)
  const pendingSeries = filterSeries(
    metricSeries,
    'db_client_connections_pending_requests',
    envFilter
  )
  const maxSeries = filterSeries(metricSeries, 'db_client_connections_max', envFilter)
  const useP95Series = filterSeries(metricSeries, 'db_connection_use', envFilter)
  const waitP95Series = filterSeries(metricSeries, 'db_connection_wait', envFilter)

  const rdsCpuSeries = rdsMetrics.find(s => s.name === 'rds_cpu_utilization')
  const rdsConnSeries = rdsMetrics.find(s => s.name === 'rds_database_connections')
  const rdsFreeMemSeries = toMbSeries(rdsMetrics.find(s => s.name === 'rds_freeable_memory'))
  const rdsReadLatSeries = rdsMetrics.find(s => s.name === 'rds_read_latency')
  const rdsWriteLatSeries = rdsMetrics.find(s => s.name === 'rds_write_latency')

  const hasPool = usageSeries.length > 0 || pendingSeries.length > 0 || maxSeries.length > 0
  const hasRds = Boolean(
    rdsCpuSeries || rdsConnSeries || rdsFreeMemSeries || rdsReadLatSeries || rdsWriteLatSeries
  )

  if (!hasPool && !hasRds) {
    return (
      <NoDataState
        title="No Database data"
        description="No DB connection or RDS metrics available."
      />
    )
  }

  // Connection Pool 추이 차트 데이터
  const poolTimes = buildTimeAxis([usageSeries[0], pendingSeries[0], maxSeries[0]])
  const poolChartData = poolTimes.map(ts => ({
    time: new Date(ts).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    active: usageSeries[0]?.points.find(p => p.ts === ts)?.value ?? null,
    pending: pendingSeries[0]?.points.find(p => p.ts === ts)?.value ?? null,
    max: maxSeries[0]?.points.find(p => p.ts === ts)?.value ?? null,
  }))

  const activeVal = getSeriesLast(usageSeries[0])
  const pendingVal = getSeriesLast(pendingSeries[0])
  const maxVal = getSeriesLast(maxSeries[0])
  const useP95Val = getSeriesLast(useP95Series[0])
  const waitP95Val = getSeriesLast(waitP95Series[0])
  const utilPct = maxVal > 0 ? (activeVal / maxVal) * 100 : 0

  // RDS 추이 차트 데이터
  const rdsTimes = buildTimeAxis([
    rdsCpuSeries,
    rdsConnSeries,
    rdsFreeMemSeries,
    rdsReadLatSeries,
    rdsWriteLatSeries,
  ])
  const rdsChartData = rdsTimes.map(ts => ({
    time: new Date(ts).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    cpu: rdsCpuSeries?.points.find(p => p.ts === ts)?.value ?? null,
    conn: rdsConnSeries?.points.find(p => p.ts === ts)?.value ?? null,
    freeMem: rdsFreeMemSeries?.points.find(p => p.ts === ts)?.value ?? null,
    readLat: rdsReadLatSeries?.points.find(p => p.ts === ts)?.value ?? null,
    writeLat: rdsWriteLatSeries?.points.find(p => p.ts === ts)?.value ?? null,
  }))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* ── Connection Pool ── */}
      {hasPool && (
        <Paper
          variant="outlined"
          sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}
        >
          <SectionLabel>Connection Pool</SectionLabel>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch' }}>
            {/* 추이 차트 */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={poolChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      {[
                        ['active', '#60a5fa'],
                        ['pending', '#fbbf24'],
                      ].map(([k, c]) => (
                        <linearGradient key={k} id={`pool-${k}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={c} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={c} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid
                      stroke={theme.palette.divider}
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={30}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                      tickLine={false}
                      axisLine={false}
                      width={32}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {maxVal > 0 && (
                      <ReferenceLine
                        y={maxVal}
                        stroke="#4ade80"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{
                          value: 'max',
                          position: 'insideTopRight',
                          fontSize: 10,
                          fill: '#4ade80',
                        }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="active"
                      name="Active"
                      stroke="#60a5fa"
                      fill="url(#pool-active)"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                      connectNulls
                    />
                    <Area
                      type="monotone"
                      dataKey="pending"
                      name="Pending"
                      stroke="#fbbf24"
                      fill="url(#pool-pending)"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                      connectNulls
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Box>

            {/* 현재값 스탯 패널 */}
            <Box
              sx={{
                flex: '0 0 220px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 0,
              }}
            >
              {/* 풀 사용률 게이지 */}
              <Box sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Pool Utilization
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      color: utilPct >= 80 ? '#f87171' : utilPct >= 60 ? '#fbbf24' : '#4ade80',
                    }}
                  >
                    {utilPct.toFixed(1)}%
                  </Typography>
                </Box>
                <Box
                  sx={{ height: 8, bgcolor: 'action.hover', borderRadius: 1, overflow: 'hidden' }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      width: `${Math.min(utilPct, 100)}%`,
                      bgcolor: utilPct >= 80 ? '#f87171' : utilPct >= 60 ? '#fbbf24' : '#4ade80',
                      borderRadius: 1,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </Box>
              </Box>
              <StatRow label="Active Connections" value={activeVal.toFixed(0)} color="#60a5fa" />
              <StatRow
                label="Pending Requests"
                value={pendingVal.toFixed(0)}
                color={pendingVal > 0 ? '#fbbf24' : 'text.secondary'}
              />
              <StatRow label="Max Pool Size" value={maxVal.toFixed(0)} color="#4ade80" />
              {useP95Val > 0 && (
                <StatRow
                  label="Use p95"
                  value={`${useP95Val.toFixed(1)}ms`}
                  color="#a78bfa"
                  sub="connection acquire time"
                />
              )}
              {waitP95Val > 0 && (
                <StatRow
                  label="Wait p95"
                  value={`${waitP95Val.toFixed(1)}ms`}
                  color="#fb923c"
                  sub="queue wait time"
                />
              )}
            </Box>
          </Box>
        </Paper>
      )}

      {/* ── RDS (CloudWatch) ── */}
      {hasRds && (
        <Paper
          variant="outlined"
          sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}
        >
          <SectionLabel>RDS · CloudWatch</SectionLabel>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch' }}>
            {/* CPU + Connections 추이 */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1 }}
              >
                CPU & Connections
              </Typography>
              <Box sx={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rdsChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid
                      stroke={theme.palette.divider}
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={30}
                    />
                    <YAxis
                      yAxisId="cpu"
                      tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                      tickLine={false}
                      axisLine={false}
                      width={32}
                      tickFormatter={v => `${v}%`}
                    />
                    <YAxis
                      yAxisId="conn"
                      orientation="right"
                      tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                      tickLine={false}
                      axisLine={false}
                      width={32}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      yAxisId="cpu"
                      type="monotone"
                      dataKey="cpu"
                      name="CPU %"
                      stroke="#f87171"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                      connectNulls
                    />
                    <Line
                      yAxisId="conn"
                      type="monotone"
                      dataKey="conn"
                      name="Connections"
                      stroke="#60a5fa"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Box>

            {/* Latency 추이 */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1 }}
              >
                Read / Write Latency
              </Typography>
              <Box sx={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rdsChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid
                      stroke={theme.palette.divider}
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={30}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                      tickFormatter={v => `${v}s`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={v => [`${Number(v).toFixed(4)}s`]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      type="monotone"
                      dataKey="readLat"
                      name="Read"
                      stroke="#34d399"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="writeLat"
                      name="Write"
                      stroke="#f87171"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Box>

            {/* RDS 현재값 스탯 */}
            <Box
              sx={{
                flex: '0 0 200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 0,
              }}
            >
              {rdsCpuSeries && (
                <StatRow
                  label="CPU Utilization"
                  value={`${getSeriesLast(rdsCpuSeries).toFixed(1)}%`}
                  color={getSeriesLast(rdsCpuSeries) >= 80 ? '#f87171' : '#4ade80'}
                />
              )}
              {rdsConnSeries && (
                <StatRow
                  label="Connections"
                  value={getSeriesLast(rdsConnSeries).toFixed(0)}
                  color="#60a5fa"
                />
              )}
              {rdsFreeMemSeries && (
                <StatRow
                  label="Freeable Memory"
                  value={`${getSeriesLast(rdsFreeMemSeries).toFixed(0)} MB`}
                  color="#fbbf24"
                />
              )}
              {rdsReadLatSeries && (
                <StatRow
                  label="Read Latency"
                  value={`${getSeriesLast(rdsReadLatSeries).toFixed(4)}s`}
                  color="#34d399"
                />
              )}
              {rdsWriteLatSeries && (
                <StatRow
                  label="Write Latency"
                  value={`${getSeriesLast(rdsWriteLatSeries).toFixed(4)}s`}
                  color="#f87171"
                />
              )}
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  )
}
