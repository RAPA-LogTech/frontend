'use client'

import { memo } from 'react'
import { Box, Card, CardContent, Typography } from '@mui/material'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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

export const LogsHistogram = memo(function LogsHistogram({
  histogramData,
  maxBucket,
  selectedBucketKey,
  onSelectBucket,
}: LogsHistogramProps) {
  const getBucketOpacity = (bucketKey: number) => {
    if (selectedBucketKey !== null) {
      return selectedBucketKey === bucketKey ? 1 : 0.22
    }

    return 1
  }

  return (
    <Card
      variant="outlined"
      sx={{
        minWidth: 0,
        width: '100%',
        p: 1,
        borderColor: 'divider',
        bgcolor: 'background.default',
        mb: 1.5,
      }}
    >
      <CardContent sx={{ p: '8px !important', minWidth: 0 }}>
        <Box sx={{ height: 220, minWidth: 0, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogramData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="tsLabel"
                minTickGap={28}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                domain={[0, Math.max(maxBucket, 1)]}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <Tooltip cursor={false} isAnimationActive={false} content={<HistogramTooltip />} />
              <Legend content={({ }) => (
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', pt: 0.5 }}>
                  {['error', 'warn', 'info', 'debug', 'unknown'].map(key => {
                    const colors: Record<string, string> = {
                      error: '#f87171', warn: '#fbbf24', info: '#60a5fa', debug: '#34d399', unknown: '#94a3b8'
                    }
                    return (
                      <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: colors[key] }} />
                        <Box component="span" sx={{ fontSize: 11 }}>{key}</Box>
                      </Box>
                    )
                  })}
                </Box>
              )} />

              <Bar
                dataKey="error"
                stackId="levels"
                fill="#f87171"
                activeBar={{ fill: '#f87171', fillOpacity: 1, stroke: '#fecaca', strokeWidth: 1.2 }}
                onClick={(_, index) => {
                  const bucket = histogramData[index]
                  if (!bucket) return
                  onSelectBucket(bucket.key)
                }}
                isAnimationActive={false}
              >
                {histogramData.map(bucket => (
                  <Cell
                    key={`bucket-error-${bucket.key}`}
                    fill="#f87171"
                    fillOpacity={getBucketOpacity(bucket.key)}
                    stroke={selectedBucketKey === bucket.key ? '#ffffff' : 'none'}
                    strokeWidth={selectedBucketKey === bucket.key ? 1.2 : 0}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Bar>

              <Bar
                dataKey="warn"
                stackId="levels"
                fill="#fbbf24"
                activeBar={{ fill: '#fbbf24', fillOpacity: 1, stroke: '#fde68a', strokeWidth: 1.2 }}
                onClick={(_, index) => {
                  const bucket = histogramData[index]
                  if (!bucket) return
                  onSelectBucket(bucket.key)
                }}
                isAnimationActive={false}
              >
                {histogramData.map(bucket => (
                  <Cell
                    key={`bucket-warn-${bucket.key}`}
                    fill="#fbbf24"
                    fillOpacity={getBucketOpacity(bucket.key)}
                    stroke={selectedBucketKey === bucket.key ? '#ffffff' : 'none'}
                    strokeWidth={selectedBucketKey === bucket.key ? 1 : 0}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Bar>

              <Bar
                dataKey="info"
                stackId="levels"
                fill="#60a5fa"
                activeBar={{ fill: '#60a5fa', fillOpacity: 1, stroke: '#bfdbfe', strokeWidth: 1.2 }}
                onClick={(_, index) => {
                  const bucket = histogramData[index]
                  if (!bucket) return
                  onSelectBucket(bucket.key)
                }}
                isAnimationActive={false}
              >
                {histogramData.map(bucket => (
                  <Cell
                    key={`bucket-info-${bucket.key}`}
                    fill="#60a5fa"
                    fillOpacity={getBucketOpacity(bucket.key)}
                    stroke={selectedBucketKey === bucket.key ? '#ffffff' : 'none'}
                    strokeWidth={selectedBucketKey === bucket.key ? 1 : 0}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Bar>

              <Bar
                dataKey="debug"
                stackId="levels"
                fill="#34d399"
                activeBar={{ fill: '#34d399', fillOpacity: 1, stroke: '#86efc6', strokeWidth: 1.2 }}
                onClick={(_, index) => {
                  const bucket = histogramData[index]
                  if (!bucket) return
                  onSelectBucket(bucket.key)
                }}
                isAnimationActive={false}
              >
                {histogramData.map(bucket => (
                  <Cell
                    key={`bucket-debug-${bucket.key}`}
                    fill="#34d399"
                    fillOpacity={getBucketOpacity(bucket.key)}
                    stroke={selectedBucketKey === bucket.key ? '#ffffff' : 'none'}
                    strokeWidth={selectedBucketKey === bucket.key ? 1 : 0}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Bar>

              <Bar
                dataKey="unknown"
                stackId="levels"
                fill="#94a3b8"
                activeBar={{ fill: '#94a3b8', fillOpacity: 1, stroke: '#cbd5e1', strokeWidth: 1.2 }}
                radius={[3, 3, 0, 0]}
                onClick={(_, index) => {
                  const bucket = histogramData[index]
                  if (!bucket) return
                  onSelectBucket(bucket.key)
                }}
                isAnimationActive={false}
              >
                {histogramData.map(bucket => (
                  <Cell
                    key={`bucket-unknown-${bucket.key}`}
                    fill="#94a3b8"
                    fillOpacity={getBucketOpacity(bucket.key)}
                    stroke={selectedBucketKey === bucket.key ? '#ffffff' : 'none'}
                    strokeWidth={selectedBucketKey === bucket.key ? 1 : 0}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 0.5, display: 'block', textAlign: 'center' }}
        >
          @timestamp per auto interval
        </Typography>
      </CardContent>
    </Card>
  )
})

export type { HistogramDataItem }
