'use client'

import { Box, Paper, Typography, useTheme } from '@mui/material'
import type { MetricSeries } from '@/lib/types'
import { getSeriesLast, filterByEnv } from '../metricsUtils'
import { SectionLabel } from '../MetricsShared'

interface Props {
  metricSeries: MetricSeries[]
  envFilter: string
}

export default function OverviewLatencyRank({ metricSeries, envFilter }: Props) {
  const theme = useTheme()

  const latencySeries = metricSeries
    .filter(s => s.name.includes('latency_p95') && filterByEnv(s, envFilter) && s.service)
    .map(s => ({ service: s.service!, value: getSeriesLast(s) / 1000 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const max = Math.max(...latencySeries.map(s => s.value), 0.001)

  const getBarColor = (val: number) => {
    if (val >= 2) return theme.palette.error.main
    if (val >= 1) return theme.palette.warning.main
    return theme.palette.success.main
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper', flex: '0 0 340px', minWidth: 0 }}>
      <SectionLabel>Latency p95 Ranking</SectionLabel>
      {latencySeries.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No latency data.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {latencySeries.map(({ service, value }) => (
            <Box key={service}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                  {service}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: getBarColor(value) }}>
                  {value.toFixed(3)}s
                </Typography>
              </Box>
              <Box sx={{ height: 8, bgcolor: 'action.hover', borderRadius: 1, overflow: 'hidden' }}>
                <Box sx={{
                  height: '100%',
                  width: `${(value / max) * 100}%`,
                  bgcolor: getBarColor(value),
                  borderRadius: 1,
                  transition: 'width 0.4s ease',
                }} />
              </Box>
            </Box>
          ))}
          <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
            {[{ label: '< 1s', color: theme.palette.success.main }, { label: '1–2s', color: theme.palette.warning.main }, { label: '≥ 2s', color: theme.palette.error.main }].map(item => (
              <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: item.color }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10 }}>{item.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  )
}
