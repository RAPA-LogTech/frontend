'use client'

import { Box, Paper, Skeleton, Stack, Typography, useTheme } from '@mui/material'
import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts'
import type { MetricSeries } from '@/lib/types'
import NoDataState from '@/components/common/NoDataState'
import { getSeriesLast, sliceLast5Min, filterByEnv } from '../metricsUtils'
import { EnvBadge, SectionLabel, StatusBadge } from '../MetricsShared'

const formatTooltipTime = (value: unknown, payload?: Array<{ payload?: { ts?: number } }>) => {
  const ts = payload?.[0]?.payload?.ts
  const target = typeof ts === 'number' ? ts : typeof value === 'number' ? value : null
  if (target == null) return '-'
  return new Date(target).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

const compactTooltipSx = {
  contentStyle: { fontSize: 11, padding: '6px 8px', borderRadius: 6 },
  labelStyle: { fontSize: 11, marginBottom: 4 },
  itemStyle: { fontSize: 11, padding: 0 },
}

type ServiceHealth = { service: string; env?: string; error_rate: number; rds_cpu?: number; rds_connections?: number; rds_freeable_memory?: number; rds_read_latency?: number; rds_write_latency?: number }

interface Props {
  serviceHealth: ServiceHealth[]
  error4xxSeries: MetricSeries[]
  error5xxSeries: MetricSeries[]
  envFilter: string
  metricSeries?: MetricSeries[] // latency, infra용
  isLoading?: boolean
}

export default function OverviewTab(props: Props) {
  const { serviceHealth, error4xxSeries, error5xxSeries, envFilter, metricSeries, isLoading } = props;
  const theme = useTheme();
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Skeleton variant="text" width={160} height={28} />
          <Skeleton variant="rounded" height={160} sx={{ mt: 1 }} />
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Skeleton variant="text" width={120} height={28} />
          <Skeleton variant="rounded" height={160} sx={{ mt: 1 }} />
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Skeleton variant="text" width={180} height={28} />
          <Skeleton variant="rounded" height={160} sx={{ mt: 1 }} />
        </Paper>
      </Box>
    )
  }
  // Service Health (RDS 제외)
  const filtered = serviceHealth.filter((h: ServiceHealth) => (envFilter === 'all' || h.env === envFilter) && h.rds_cpu === undefined);

  // Latency
  const latencySeries = (metricSeries ?? []).filter((s: MetricSeries) => s.name.includes('latency_p95') && filterByEnv(s, envFilter));
  const latencyServices = [...new Set(latencySeries.map((s: MetricSeries) => s.service).filter(Boolean))] as string[];

  // Infra (Container)
  const cpuSeries = (metricSeries ?? []).filter((s: MetricSeries) => s.name.includes('cpu_usage') && filterByEnv(s, envFilter));
  const memorySeries = (metricSeries ?? []).filter((s: MetricSeries) => s.name.includes('memory_usage') && filterByEnv(s, envFilter));
  const infraServices = [...new Set([...cpuSeries, ...memorySeries].map((s: MetricSeries) => s.service).filter(Boolean))] as string[];
  // RDS
  const rdsList = serviceHealth.filter((h: ServiceHealth) => h.rds_cpu !== undefined);
  const hasServiceHealth = filtered.length > 0;
  const hasLatency = latencyServices.length > 0;
  const hasInfrastructure = infraServices.length > 0 || rdsList.length > 0;
  const showGlobalNoData = !hasServiceHealth && !hasLatency && !hasInfrastructure;

  if (showGlobalNoData) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <NoDataState
          title="No metric data"
          description="No data available for Service Health, Latency, and Infrastructure in the selected environment."
        />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Service Health */}
      <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <SectionLabel>Service Health</SectionLabel>
        {filtered.length > 0 ? (
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
                            4xx: {(getSeriesLast(s4xx) * 100).toFixed(1)}%
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.error.main }}>
                            5xx: {(getSeriesLast(s5xx) * 100).toFixed(1)}%
                          </Typography>
                        </Stack>
                        <Box sx={{ height: 56, mt: 0.75 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={(() => {
                              const p4 = sliceLast5Min(s4xx?.points ?? [])
                              const p5 = sliceLast5Min(s5xx?.points ?? [])
                              const len = Math.max(p4.length, p5.length)
                              return Array.from({ length: len }, (_, i) => ({
                                i,
                                ts: p4[i]?.ts ?? p5[i]?.ts ?? null,
                                v4xx: p4[i]?.value ?? null,
                                v5xx: p5[i]?.value ?? null,
                              }))
                            })()} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                              <YAxis hide domain={[0, 'auto']} />
                              <Tooltip
                                cursor={false}
                                isAnimationActive={false}
                                labelFormatter={(label, payload) => formatTooltipTime(label, payload as Array<{ payload?: { ts?: number } }>)}
                                formatter={(value, name) => [
                                  `${(Number(value ?? 0) * 100).toFixed(2)}%`,
                                  name,
                                ]}
                                {...compactTooltipSx}
                              />
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
        ) : (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>No service health data.</Typography>
        )}
      </Paper>

      {/* Latency */}
      <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <SectionLabel>Latency p95</SectionLabel>
        {latencyServices.length > 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {latencyServices.map(svc => {
              const s = latencySeries.find(l => l.service === svc)
              const val = getSeriesLast(s)
              // ms → s 변환 (소수점 2자리)
              const valSec = val / 1000
              return (
                <Box key={svc} sx={{ flex: '1 1 220px', minWidth: 0, maxWidth: 300 }}>
                  <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1, display: 'block', mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {svc.toUpperCase()}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>{valSec.toFixed(2)}s</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>p95 latency</Typography>
                    {s && <ResponsiveContainer width="100%" height={40}>
                      <LineChart data={sliceLast5Min(s.points)} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                        <YAxis hide domain={[0, 'auto']} />
                        <Tooltip
                          cursor={false}
                          isAnimationActive={false}
                          labelFormatter={(label, payload) => formatTooltipTime(label, payload as Array<{ payload?: { ts?: number } }>)}
                          formatter={(value) => [`${(Number(value ?? 0) / 1000).toFixed(2)}s`, 'p95']}
                          {...compactTooltipSx}
                        />
                        <Line type="monotone" dataKey="value" stroke={theme.palette.warning.main} strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>}
                  </Paper>
                </Box>
              )
            })}
          </Box>
        ) : (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>No latency data.</Typography>
        )}
      </Paper>

      {/* Infrastructure Summary */}
      <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <SectionLabel>Infrastructure Summary</SectionLabel>
        {hasInfrastructure ? null : (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>No infrastructure data.</Typography>
        )}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          {/* Container CPU/MEM */}
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
                      {cpu && <ResponsiveContainer width="100%" height={32}>
                        <LineChart data={sliceLast5Min(cpu.points)} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                          <YAxis hide domain={[0, 'auto']} />
                          <Tooltip
                            cursor={false}
                            isAnimationActive={false}
                            labelFormatter={(label, payload) => formatTooltipTime(label, payload as Array<{ payload?: { ts?: number } }>)}
                            formatter={(value) => [`${Number(value ?? 0).toFixed(2)}%`, 'CPU']}
                            {...compactTooltipSx}
                          />
                          <Line type="monotone" dataKey="value" stroke={theme.palette.success.main} strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>{getSeriesLast(mem).toFixed(2)}%</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>MEM avg</Typography>
                      {mem && <ResponsiveContainer width="100%" height={32}>
                        <LineChart data={sliceLast5Min(mem.points)} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                          <YAxis hide domain={[0, 'auto']} />
                          <Tooltip
                            cursor={false}
                            isAnimationActive={false}
                            labelFormatter={(label, payload) => formatTooltipTime(label, payload as Array<{ payload?: { ts?: number } }>)}
                            formatter={(value) => [`${Number(value ?? 0).toFixed(2)}%`, 'MEM']}
                            {...compactTooltipSx}
                          />
                          <Line type="monotone" dataKey="value" stroke={theme.palette.secondary.main} strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>}
                    </Box>
                  </Stack>
                </Paper>
              </Box>
            )
          })}

          {/* RDS */}
          {rdsList.map((h, idx) => (
            <Box key={idx} sx={{ flex: '1 1 320px', minWidth: 0, maxWidth: 400 }}>
              <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1, display: 'block', mb: 1 }}>RDS</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>{(h.rds_cpu as number)?.toFixed(1) ?? '-' }%</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>CPU</Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.info.main }}>{(h.rds_connections as number ?? 0).toFixed(0)}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Connections</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, mt: 2 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>{(h.rds_freeable_memory as number)?.toLocaleString() ?? '-'}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Freeable Memory (bytes)</Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>{(h.rds_read_latency as number)?.toFixed(3) ?? '-'}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Read Latency (s)</Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.error.main }}>{(h.rds_write_latency as number)?.toFixed(3) ?? '-'}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Write Latency (s)</Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  )
}
