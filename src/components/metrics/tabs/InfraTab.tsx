'use client'

import { Box, Paper, Stack, Typography, useTheme } from '@mui/material'
import type { MetricSeries } from '@/lib/types'
import NoDataState from '@/components/common/NoDataState'
import { getSeriesLast, sliceLast5Min } from '../metricsUtils'
import { MiniSparkline, SectionLabel } from '../MetricsShared'

type ServiceHealth = { service: string; env?: string; error_rate: number; rds_cpu?: number; rds_connections?: number }

interface Props {
  metricSeries: MetricSeries[]
  serviceHealth: ServiceHealth[]
  envFilter: string
}

function filterSeries(series: MetricSeries[], name: string, envFilter: string) {
  return series.filter(s => {
    if (!s.name.includes(name)) return false
    if (envFilter === 'all') return true
    const env = (s as MetricSeries & { env?: string }).env
    return env ? env === envFilter : false
  })
}

export default function InfraTab({ metricSeries, serviceHealth, envFilter }: Props) {
  const theme = useTheme()

  const cpuSeries = filterSeries(metricSeries, 'cpu_usage', envFilter)
  const memorySeries = filterSeries(metricSeries, 'memory_usage', envFilter)
  const latencySeries = filterSeries(metricSeries, 'latency_p95', envFilter)
  const rdsList = serviceHealth.filter(h => h.rds_cpu !== undefined)

  const infraServices = [...new Set([...cpuSeries, ...memorySeries].map(s => s.service).filter(Boolean))] as string[]
  const latencyServices = [...new Set(latencySeries.map(s => s.service).filter(Boolean))] as string[]

  if (infraServices.length === 0 && latencyServices.length === 0 && rdsList.length === 0) {
    return <NoDataState title="No Infra data" description="No infrastructure metrics available." />
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Latency p95 */}
      {latencyServices.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <SectionLabel>Latency p95</SectionLabel>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {latencyServices.map(svc => {
              const s = latencySeries.find(l => l.service === svc)
              const val = getSeriesLast(s)
              return (
                <Box key={svc} sx={{ flex: '1 1 220px', minWidth: 0, maxWidth: 300 }}>
                  <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1, display: 'block', mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {svc.toUpperCase()}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>{val.toFixed(0)}ms</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>p95 latency</Typography>
                    {s && <MiniSparkline series={{ ...s, points: sliceLast5Min(s.points) }} color={theme.palette.warning.main} />}
                  </Paper>
                </Box>
              )
            })}
          </Box>
        </Paper>
      )}

      {/* Container CPU / Memory */}
      {infraServices.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <SectionLabel>Container Resources</SectionLabel>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {infraServices.map(svc => {
              const cpu = cpuSeries.find(s => s.service === svc)
              const mem = memorySeries.find(s => s.service === svc)
              return (
                <Box key={svc} sx={{ flex: '1 1 220px', minWidth: 0, maxWidth: 300 }}>
                  <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1, display: 'block', mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {svc.toUpperCase()}
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>{getSeriesLast(cpu).toFixed(2)}%</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>CPU avg</Typography>
                        {cpu && <MiniSparkline series={{ ...cpu, points: sliceLast5Min(cpu.points) }} color={theme.palette.success.main} />}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>{getSeriesLast(mem).toFixed(2)}%</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>MEM avg</Typography>
                        {mem && <MiniSparkline series={{ ...mem, points: sliceLast5Min(mem.points) }} color={theme.palette.secondary.main} />}
                      </Box>
                    </Stack>
                  </Paper>
                </Box>
              )
            })}
          </Box>
        </Paper>
      )}

      {/* RDS */}
      {rdsList.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <SectionLabel>RDS</SectionLabel>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {rdsList.map(h => (
              <Box key="rds" sx={{ flex: '1 1 220px', minWidth: 0, maxWidth: 300 }}>
                <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1, display: 'block', mb: 1 }}>RDS</Typography>
                  <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>{(h.rds_cpu as number).toFixed(1)}%</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>CPU</Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.info.main }}>{(h.rds_connections as number ?? 0).toFixed(0)}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Connections</Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  )
}
