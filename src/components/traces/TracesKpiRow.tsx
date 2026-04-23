'use client'

import { Box, Paper, Typography } from '@mui/material'
import type { Trace } from '@/lib/types'

interface Props {
  traces: Trace[]
}

function KpiCard({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string
  sub: string
  color: string
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
        '&:hover': { boxShadow: `0 0 0 1px ${color}55` },
        transition: 'box-shadow 0.2s',
      }}
    >
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 0.5 }}
      >
        {label}
      </Typography>
      <Typography
        variant="h4"
        sx={{ fontWeight: 800, color, mt: 0.25, lineHeight: 1.2, fontFamily: 'monospace' }}
      >
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {sub}
      </Typography>
    </Paper>
  )
}

export default function TracesKpiRow({ traces }: Props) {
  const total = traces.length
  const errors = traces.filter(t => t.status === 'error').length
  const errorRate = total > 0 ? (errors / total) * 100 : 0
  const avgDuration = total > 0 ? traces.reduce((s, t) => s + t.duration, 0) / total / 1000 : 0
  const services = new Set(traces.map(t => t.service)).size

  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <KpiCard
        label="TOTAL TRACES"
        value={total.toLocaleString()}
        sub="last 10 minutes"
        color="#a78bfa"
      />
      <KpiCard
        label="ERROR RATE"
        value={`${errorRate.toFixed(1)}%`}
        sub={`${errors} error traces`}
        color={errorRate >= 10 ? '#f87171' : errorRate >= 1 ? '#fbbf24' : '#4ade80'}
      />
      <KpiCard
        label="AVG DURATION"
        value={`${avgDuration.toFixed(3)}s`}
        sub="mean trace duration"
        color="#60a5fa"
      />
      <KpiCard label="SERVICES" value={String(services)} sub="unique services" color="#34d399" />
    </Box>
  )
}
