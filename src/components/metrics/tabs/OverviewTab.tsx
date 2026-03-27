'use client'

import { Box, Paper, Stack, Typography, useTheme } from '@mui/material'
import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts'
import type { MetricSeries } from '@/lib/types'
import NoDataState from '@/components/common/NoDataState'
import { getSeriesLast, sliceLast5Min } from '../metricsUtils'
import { EnvBadge, SectionLabel, StatusBadge } from '../MetricsShared'

type ServiceHealth = { service: string; env?: string; error_rate: number; rds_cpu?: number }

interface Props {
  serviceHealth: ServiceHealth[]
  error4xxSeries: MetricSeries[]
  error5xxSeries: MetricSeries[]
  envFilter: string
}

export default function OverviewTab({ serviceHealth, error4xxSeries, error5xxSeries, envFilter }: Props) {
  const theme = useTheme()
  const filtered = serviceHealth.filter(h => (envFilter === 'all' || h.env === envFilter) && h.rds_cpu === undefined)

  return (
    <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <SectionLabel>Service Health</SectionLabel>
      {filtered.length === 0 ? (
        <NoDataState title="No service health data" description="No data available for the selected environment." />
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          {filtered.map(h => {
            const s4xx = error4xxSeries.find(s => s.service === h.service)
            const s5xx = error5xxSeries.find(s => s.service === h.service)
            return (
              <Box key={`${h.service}-${h.env}`} sx={{ flex: '1 1 220px', minWidth: 0, maxWidth: 300 }}>
                <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 1, height: '100%' }}>
                  <Stack direction="row" spacing={0.75} alignItems="center" mb={0.5} sx={{ overflow: 'hidden' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                      {h.service.toUpperCase()}
                    </Typography>
                    <EnvBadge env={h.env} />
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>{h.error_rate.toFixed(1)}%</Typography>
                    <StatusBadge value={h.error_rate} />
                  </Stack>
                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.25, display: 'block' }}>HTTP error ratio (5m)</Typography>
                  {(s4xx || s5xx) && (
                    <>
                      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                          4xx: {getSeriesLast(s4xx).toFixed(1)}%
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.error.main }}>
                          5xx: {getSeriesLast(s5xx).toFixed(1)}%
                        </Typography>
                      </Stack>
                      <Box sx={{ height: 56, mt: 0.75 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={(() => {
                            const p4 = sliceLast5Min(s4xx?.points ?? [])
                            const p5 = sliceLast5Min(s5xx?.points ?? [])
                            const len = Math.max(p4.length, p5.length)
                            return Array.from({ length: len }, (_, i) => ({ i, v4xx: p4[i]?.value ?? null, v5xx: p5[i]?.value ?? null }))
                          })()} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                            <YAxis hide domain={[0, 'auto']} />
                            <Line type="monotone" dataKey="v4xx" name="4xx" stroke={theme.palette.warning.main} strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls />
                            <Line type="monotone" dataKey="v5xx" name="5xx" stroke={theme.palette.error.main} strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </>
                  )}
                </Paper>
              </Box>
            )
          })}
        </Box>
      )}
    </Paper>
  )
}
