'use client'

import { Box, Chip, Typography, useTheme } from '@mui/material'
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts'
import type { MetricSeries } from '@/lib/types'
import { sliceLast5Min } from './metricsUtils'

export function StatusBadge({ value }: { value: number }) {
  const isWarn = value > 1
  return (
    <Chip
      label={isWarn ? '주의' : '정상'}
      size="small"
      color={isWarn ? 'warning' : 'success'}
      variant="outlined"
      sx={{ height: 20, fontSize: 11, fontWeight: 700, borderRadius: 1, px: 0.25 }}
    />
  )
}

export function EnvBadge({ env }: { env?: string }) {
  if (!env) return null
  const isProd = env === 'prod'
  return (
    <Chip
      label={env.toUpperCase()}
      size="small"
      color={isProd ? 'info' : 'secondary'}
      variant="outlined"
      sx={{ height: 18, fontSize: 10, fontWeight: 700, borderRadius: 0.75, px: 0.25 }}
    />
  )
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
      <Box sx={{ width: 3, height: 16, bgcolor: 'primary.main', borderRadius: 1 }} />
      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1 }}>
        {children}
      </Typography>
    </Box>
  )
}

export function MiniSparkline({ series, color }: { series: MetricSeries; color: string }) {
  const points = sliceLast5Min(series.points)
  if (points.length === 0) return <Box sx={{ height: 48 }} />
  const values = points.map(p => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const spread = Math.max(1, max - min)
  const data = points.map((p, i) => ({ i, v: p.value }))
  return (
    <Box sx={{ height: 48, width: '100%', mt: 1 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`sg-${series.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <YAxis hide domain={[Math.max(0, min - spread * 0.1), max + spread * 0.1]} />
          <Area type="monotone" dataKey="v" stroke={color} fill={`url(#sg-${series.id})`} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  )
}
