'use client'

import { Box, Paper, Typography, Skeleton } from '@mui/material'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import type { MetricSeries, Trace, LogEntry } from '@/lib/types'

type ServiceHealth = { service: string; env?: string; error_rate: number; rds_cpu?: number }

interface Props {
  serviceHealth: ServiceHealth[]
  metricSeries: MetricSeries[]
  traces: Trace[]
  errorLogs: LogEntry[]
  isLoading: boolean
}

function Sparkline({ points, color }: { points: { v: number }[]; color: string }) {
  if (points.length < 2) return <Box sx={{ height: 40 }} />
  return (
    <Box sx={{ height: 40, mt: 1 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`kpi-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            fill={`url(#kpi-${color.replace('#', '')})`}
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
        '&:hover': { boxShadow: `0 0 0 1px ${color}66` },
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
          <Skeleton variant="text" width="60%" height={40} sx={{ mt: 0.5 }} />
          <Skeleton variant="rounded" height={40} sx={{ mt: 1 }} />
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

export default function KpiRow({
  serviceHealth,
  metricSeries,
  traces,
  errorLogs,
  isLoading,
}: Props) {
  const services = serviceHealth.filter(h => h.rds_cpu === undefined)
  const healthy = services.filter(s => s.error_rate < 1).length
  const avgError =
    services.length > 0 ? services.reduce((sum, s) => sum + s.error_rate, 0) / services.length : 0

  const latencySeries = metricSeries.filter(s => s.name.includes('latency_p95'))
  const avgLatency =
    latencySeries.length > 0
      ? latencySeries.reduce((sum, s) => {
          const last = s.points[s.points.length - 1]?.value ?? 0
          return sum + last
        }, 0) /
        latencySeries.length /
        1000
      : 0

  const errorSparkPoints = services.map((s, i) => ({ v: s.error_rate }))
  const latencyPoints = latencySeries[0]?.points.slice(-12).map(p => ({ v: p.value / 1000 })) ?? []
  const tracePoints = Array.from({ length: 10 }, (_, i) => ({
    v: Math.max(0, traces.length - i * 2),
  })).reverse()
  const errorLogPoints = Array.from({ length: 10 }, (_, i) => ({
    v: Math.max(0, errorLogs.length - i * 3),
  })).reverse()

  const healthColor =
    healthy === services.length ? '#4ade80' : healthy > services.length / 2 ? '#fbbf24' : '#f87171'

  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <KpiCard
        label="HEALTHY SERVICES"
        value={`${healthy} / ${services.length}`}
        sub="services operational"
        color={healthColor}
        sparkPoints={services.map(s => ({ v: s.error_rate < 1 ? 1 : 0 }))}
        isLoading={isLoading}
      />
      <KpiCard
        label="AVG ERROR RATE"
        value={`${avgError.toFixed(2)}%`}
        sub="across all services"
        color={avgError >= 60 ? '#f87171' : avgError >= 1 ? '#fbbf24' : '#4ade80'}
        sparkPoints={errorSparkPoints}
        isLoading={isLoading}
      />
      <KpiCard
        label="P95 LATENCY"
        value={`${avgLatency.toFixed(2)}s`}
        sub="avg across services"
        color="#60a5fa"
        sparkPoints={latencyPoints}
        isLoading={isLoading}
      />
      <KpiCard
        label="ACTIVE TRACES"
        value={traces.length.toLocaleString()}
        sub="last 10 minutes"
        color="#a78bfa"
        sparkPoints={tracePoints}
        isLoading={isLoading}
      />
      <KpiCard
        label="ERROR LOGS (1h)"
        value={errorLogs.length.toLocaleString()}
        sub="ERROR level logs"
        color="#f87171"
        sparkPoints={errorLogPoints}
        isLoading={isLoading}
      />
    </Box>
  )
}
