'use client'

import { useMemo } from 'react'
import { Box, Paper, Typography, useTheme } from '@mui/material'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { MetricSeries } from '@/lib/types'
import LiveButton from '@/components/logs/LogFilters/LiveButton'

type ServiceHealth = { service: string; env?: string; error_rate: number; rds_cpu?: number }

interface Props {
  serviceHealth: ServiceHealth[]
  metricSeries: MetricSeries[]
}

const SERVICE_COLORS = [
  '#f87171',
  '#60a5fa',
  '#4ade80',
  '#fbbf24',
  '#a78bfa',
  '#fb923c',
  '#34d399',
  '#e879f9',
]

export default function ErrorRateChart({ serviceHealth, metricSeries }: Props) {
  const theme = useTheme()

  const services = serviceHealth.filter(h => h.rds_cpu === undefined).slice(0, 6)

  const series4xx = metricSeries.filter(s => s.name.includes('4xx_ratio'))
  const series5xx = metricSeries.filter(s => s.name.includes('5xx_ratio'))

  const chartData = useMemo(() => {
    const allSeries = [...series4xx, ...series5xx]
    if (allSeries.length === 0) {
      // metric series 없으면 service health 정적 데이터로 폴백
      return services.map((s, i) => ({ time: `${i}m ago`, [s.service]: s.error_rate }))
    }

    const timeSet = new Set<number>()
    allSeries.forEach(s => s.points.forEach(p => timeSet.add(p.ts)))
    const times = Array.from(timeSet).sort().slice(-30)

    return times.map(ts => {
      const row: Record<string, number | string> = {
        time: new Date(ts).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
      }
      services.forEach(svc => {
        const s4 = series4xx.find(s => s.service === svc.service)
        const s5 = series5xx.find(s => s.service === svc.service)
        const v4 = s4?.points.find(p => p.ts === ts)?.value ?? 0
        const v5 = s5?.points.find(p => p.ts === ts)?.value ?? 0
        row[svc.service] = parseFloat(((v4 + v5) * 100).toFixed(2))
      })
      return row
    })
  }, [services, series4xx, series5xx])

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper', flex: '1 1 0', minWidth: 0 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Error Rate Trend
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            4xx + 5xx ratio per service · last 30 points
          </Typography>
        </Box>
        <LiveButton value isStreaming onChange={() => {}} />
      </Box>

      <Box sx={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              {services.map((svc, i) => (
                <linearGradient key={svc.service} id={`er-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={SERVICE_COLORS[i]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={SERVICE_COLORS[i]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke={theme.palette.divider} strokeDasharray="3 3" vertical={false} />
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
              width={36}
              tickFormatter={v => `${v}%`}
            />
            <ReferenceLine
              y={60}
              stroke="#f87171"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: 'alert threshold 60%',
                position: 'insideTopRight',
                fontSize: 10,
                fill: '#f87171',
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value, name) => [`${value ?? 0}%`, name as string]}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {services.map((svc, i) => (
              <Area
                key={svc.service}
                type="monotone"
                dataKey={svc.service}
                stroke={SERVICE_COLORS[i]}
                fill={`url(#er-${i})`}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  )
}
