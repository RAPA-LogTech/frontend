'use client'

import { memo } from 'react'
import { Box, Typography, useTheme } from '@mui/material'
import {
  Bar, BarChart, CartesianGrid, Cell, ComposedChart,
  Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { HistogramTooltip } from './HistogramTooltip'

type HistogramDataItem = {
  key: number
  tsLabel: string
  tsFullLabel: string
  bucketStart: Date
  bucketEnd: Date
  count: number
  debug: number
  info: number
  warn: number
  error: number
  unknown: number
  label: Date
  interval: number
}

interface LogsHistogramProps {
  histogramData: HistogramDataItem[]
  maxBucket: number
  selectedBucketKey: number | null
  onSelectBucket: (bucketKey: number) => void
}

const LEVEL_COLORS = {
  error: '#f87171',
  warn: '#fbbf24',
  info: '#60a5fa',
  debug: '#34d399',
  unknown: '#94a3b8',
}

export const LogsHistogram = memo(function LogsHistogram({
  histogramData,
  maxBucket,
  selectedBucketKey,
  onSelectBucket,
}: LogsHistogramProps) {
  const theme = useTheme()

  const totalLogs = histogramData.reduce((s, b) => s + b.count, 0)
  const totalErrors = histogramData.reduce((s, b) => s + b.error, 0)
  const totalWarns = histogramData.reduce((s, b) => s + b.warn, 0)
  const errorRate = totalLogs > 0 ? (totalErrors / totalLogs) * 100 : 0

  // 에러율 라인 데이터 (각 버킷의 에러 비율 %)
  const chartData = histogramData.map(b => ({
    ...b,
    errorRate: b.count > 0 ? parseFloat(((b.error / b.count) * 100).toFixed(1)) : 0,
  }))

  const getBucketOpacity = (key: number) =>
    selectedBucketKey !== null ? (selectedBucketKey === key ? 1 : 0.18) : 1

  const handleClick = (_: unknown, index: number) => {
    const bucket = histogramData[index]
    if (bucket) onSelectBucket(bucket.key)
  }

  return (
    <Box sx={{ mb: 1.5 }}>
      {/* KPI 배너 */}
      <Box sx={{
        display: 'flex', gap: 1, mb: 1,
        p: 1.25, borderRadius: 1.5,
        border: '1px solid', borderColor: 'divider',
        bgcolor: 'background.default',
      }}>
        {[
          { label: 'Total', value: totalLogs.toLocaleString(), color: theme.palette.text.primary },
          { label: 'ERROR', value: totalErrors.toLocaleString(), color: LEVEL_COLORS.error },
          { label: 'WARN', value: totalWarns.toLocaleString(), color: LEVEL_COLORS.warn },
          { label: 'Error Rate', value: `${errorRate.toFixed(1)}%`, color: errorRate >= 10 ? LEVEL_COLORS.error : errorRate >= 1 ? LEVEL_COLORS.warn : '#4ade80' },
        ].map(item => (
          <Box key={item.label} sx={{ flex: 1, textAlign: 'center', borderRight: '1px solid', borderColor: 'divider', '&:last-child': { borderRight: 'none' } }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: 0.5 }}>
              {item.label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: item.color, fontFamily: 'monospace' }}>
              {item.value}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* 차트 */}
      <Box sx={{
        border: '1px solid', borderColor: 'divider',
        borderRadius: 1.5, bgcolor: 'background.default',
        p: 1, overflow: 'hidden',
      }}>
        <Box sx={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 4, right: 40, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="errorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f87171" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
              <XAxis
                dataKey="tsLabel"
                minTickGap={28}
                tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="count"
                allowDecimals={false}
                domain={[0, Math.max(maxBucket, 1)]}
                tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <YAxis
                yAxisId="rate"
                orientation="right"
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: LEVEL_COLORS.error }}
                tickLine={false}
                axisLine={false}
                width={32}
                tickFormatter={v => `${v}%`}
              />
              <Tooltip cursor={false} isAnimationActive={false} content={<HistogramTooltip />} />

              {/* 스택 바 */}
              {(['error', 'warn', 'info', 'debug', 'unknown'] as const).map((level, idx) => (
                <Bar
                  key={level}
                  yAxisId="count"
                  dataKey={level}
                  stackId="levels"
                  fill={LEVEL_COLORS[level]}
                  radius={idx === 4 ? [3, 3, 0, 0] : undefined}
                  activeBar={{ fill: LEVEL_COLORS[level], fillOpacity: 1, stroke: '#ffffff44', strokeWidth: 1 }}
                  onClick={handleClick}
                  isAnimationActive={false}
                >
                  {chartData.map(bucket => (
                    <Cell
                      key={`${level}-${bucket.key}`}
                      fill={LEVEL_COLORS[level]}
                      fillOpacity={getBucketOpacity(bucket.key)}
                      stroke={selectedBucketKey === bucket.key ? '#ffffff' : 'none'}
                      strokeWidth={selectedBucketKey === bucket.key ? 1 : 0}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </Bar>
              ))}

              {/* 에러율 라인 오버레이 */}
              <Line
                yAxisId="rate"
                type="monotone"
                dataKey="errorRate"
                stroke={LEVEL_COLORS.error}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
                strokeDasharray="4 2"
                name="Error Rate %"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>

        {/* 레전드 */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', pt: 0.75 }}>
          {Object.entries(LEVEL_COLORS).map(([key, color]) => (
            <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: color }} />
              <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary' }}>{key}</Typography>
            </Box>
          ))}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 16, height: 2, bgcolor: LEVEL_COLORS.error, borderRadius: 1, opacity: 0.7 }} />
            <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary' }}>error rate %</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )
})

export type { HistogramDataItem }
