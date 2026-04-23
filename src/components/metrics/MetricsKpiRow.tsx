'use client'

import { Box, Paper, Skeleton, Typography } from '@mui/material'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import type { MetricSeries } from '@/lib/types'
import { getSeriesLast, filterByEnv } from './metricsUtils'

type ServiceHealth = { service: string; env?: string; error_rate: number; rds_cpu?: number }

interface Props {
  serviceHealth: ServiceHealth[]
  metricSeries: MetricSeries[]
  envFilter: string
  isLoading: boolean
}

function Sparkline({ points, color }: { points: { v: number }[]; color: string }) {
  if (points.length < 2) return <Box sx={{ height: 36 }} />
  return (
    <Box sx={{ height: 36, mt: 0.75 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`mkpi-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            fill={`url(#mkpi-${color.replace('#', '')})`}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  )
}

function KpiCard({
  label,
  value,
  sub,
  color,
  sparkPoints,
  isLoading,
}: {
  label: string
  value: string
  sub: string
  color: string
  sparkPoints: { v: number }[]
  isLoading: boolean
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        flex: '1 1 0',
        minWidth: 0,
        p: 2,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        borderTop: `3px solid ${color}`,
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: `0 0 0 1px ${color}55` },
      }}
    >
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 0.5 }}
      >
        {label}
      </Typography>
      {isLoading ? (
        <>
          <Skeleton variant="text" width="60%" height={36} sx={{ mt: 0.5 }} />
          <Skeleton variant="rounded" height={36} sx={{ mt: 0.75 }} />
        </>
      ) : (
        <>
          <Typography variant="h4" sx={{ fontWeight: 800, color, mt: 0.25, lineHeight: 1.2 }}>
            {value}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {sub}
          </Typography>
          <Sparkline points={sparkPoints} color={color} />
        </>
      )}
    </Paper>
  )
}

export default function MetricsKpiRow({
  serviceHealth,
  metricSeries,
  envFilter,
  isLoading,
}: Props) {
  const services = serviceHealth.filter(h => !h.rds_cpu)
  const filtered = services.filter(h => envFilter === 'all' || h.env === envFilter)

  const healthy = filtered.filter(s => s.error_rate < 1).length
  const avgError =
    filtered.length > 0 ? filtered.reduce((sum, s) => sum + s.error_rate, 0) / filtered.length : 0

  const latencySeries = metricSeries.filter(
    s => s.name.includes('latency_p95') && filterByEnv(s, envFilter)
  )
  const avgLatency =
    latencySeries.length > 0
      ? latencySeries.reduce((sum, s) => sum + getSeriesLast(s), 0) / latencySeries.length / 1000
      : 0

  const throughputSeries = metricSeries.filter(
    s => s.name.includes('request_rate') && filterByEnv(s, envFilter)
  )
  const totalThroughput = throughputSeries.reduce((sum, s) => sum + getSeriesLast(s), 0)

  const healthColor =
    healthy === filtered.length ? '#4ade80' : healthy > filtered.length / 2 ? '#fbbf24' : '#f87171'
  const errorColor = avgError >= 60 ? '#f87171' : avgError >= 1 ? '#fbbf24' : '#4ade80'

  const latencyPoints = latencySeries[0]?.points.slice(-12).map(p => ({ v: p.value / 1000 })) ?? []
  const throughputPoints = throughputSeries[0]?.points.slice(-12).map(p => ({ v: p.value })) ?? []

  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <KpiCard
        label="AVG ERROR RATE"
        value={`${avgError.toFixed(2)}%`}
        sub={`${filtered.length} services · ${envFilter.toUpperCase()}`}
        color={errorColor}
        sparkPoints={filtered.map(s => ({ v: s.error_rate }))}
        isLoading={isLoading}
      />
      <KpiCard
        label="TOTAL THROUGHPUT"
        value={`${totalThroughput.toFixed(1)}`}
        sub="req/s across all services"
        color="#60a5fa"
        sparkPoints={throughputPoints}
        isLoading={isLoading}
      />
      <KpiCard
        label="AVG P95 LATENCY"
        value={`${avgLatency.toFixed(2)}s`}
        sub="avg across services"
        color="#fbbf24"
        sparkPoints={latencyPoints}
        isLoading={isLoading}
      />
      <KpiCard
        label="HEALTHY SERVICES"
        value={`${healthy} / ${filtered.length}`}
        sub="error rate < 1%"
        color={healthColor}
        sparkPoints={filtered.map(s => ({ v: s.error_rate < 1 ? 1 : 0 }))}
        isLoading={isLoading}
      />
    </Box>
  )
}
