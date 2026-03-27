'use client'

import { memo } from 'react'
import { Box, Stack, Typography } from '@mui/material'

type HistogramTooltipItem = {
  tsLabel?: string
  tsFullLabel?: string
  bucketStart?: Date
  bucketEnd?: Date
  debug?: number
  info?: number
  warn?: number
  error?: number
  count?: number
}

interface HistogramTooltipProps {
  active?: boolean
  payload?: Array<{ payload?: HistogramTooltipItem }>
}

export const HistogramTooltip = memo(function HistogramTooltip({
  active,
  payload,
}: HistogramTooltipProps) {
  const item = payload?.[0]?.payload
  if (!active || !item) return null

  const total = item.count ?? 0
  const levels = [
    { key: 'DEBUG', value: item.debug ?? 0, color: '#34d399' },
    { key: 'INFO', value: item.info ?? 0, color: '#60a5fa' },
    { key: 'WARN', value: item.warn ?? 0, color: '#fbbf24' },
    { key: 'ERROR', value: item.error ?? 0, color: '#f87171' },
  ]

  let rangeLabel = ''
  if (item.bucketStart && item.bucketEnd) {
    const formatTime = (d: number | string | Date) => {
      const date = d instanceof Date ? d : new Date(d)
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    }
    rangeLabel = `${formatTime(item.bucketStart)} ~ ${formatTime(item.bucketEnd)}`
  } else if (item.tsFullLabel) {
    rangeLabel = item.tsFullLabel
  } else if (item.tsLabel) {
    rangeLabel = item.tsLabel
  }

  return (
    <Box
      sx={{
        px: 1.25,
        py: 1,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
        minWidth: 220,
      }}
    >
      <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, mb: 0.5 }}>
        {rangeLabel && `구간: ${rangeLabel}`}
      </Typography>
      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.75 }}>
        Total Logs: {total.toLocaleString()}
      </Typography>

      <Stack gap={0.4}>
        {levels.map(level => {
          const ratio = total > 0 ? (level.value / total) * 100 : 0
          return (
            <Stack
              key={level.key}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={0.6} alignItems="center">
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: level.color,
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {level.key}
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {level.value.toLocaleString()} ({ratio.toFixed(1)}%)
              </Typography>
            </Stack>
          )
        })}
      </Stack>
    </Box>
  )
})

export type { HistogramTooltipItem }
