'use client'

import { useQuery } from '@tanstack/react-query'
import { Box, Paper, Skeleton, Typography, useTheme } from '@mui/material'
import type { MetricSeries } from '@/lib/types'
import { getContainerMetrics, getHostMetrics } from '@/lib/apiClient'
import NoDataState from '@/components/common/NoDataState'
import { getSeriesLast, sliceLast5Min, filterByEnv } from '../metricsUtils'
import { MiniSparkline, SectionLabel } from '../MetricsShared'

async function getJvmMetrics(): Promise<MetricSeries[]> {
  try {
    const res = await fetch('/api/observability/metrics/jvm')
    if (!res.ok) return []
    const data = await res.json()
    if (Array.isArray(data)) return data as MetricSeries[]
    if (data?.metrics && Array.isArray(data.metrics)) return data.metrics as MetricSeries[]
    return []
  } catch {
    return []
  }
}

const BYTES_PER_MB = 1024 * 1024

interface Props {
  envFilter: string
}

function MetricCard({ series, label, unit, color }: { series?: MetricSeries; label: string; unit: string; color: string }) {
  const val = getSeriesLast(series)
  return (
    <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 1 }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1, display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 700, color }}>
        {val.toFixed(2)}{unit}
      </Typography>
      {series && <MiniSparkline series={{ ...series, points: sliceLast5Min(series.points) }} color={color} />}
    </Paper>
  )
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0 B'
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB']
  const exp = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1)
  const normalized = value / (1024 ** exp)
  return `${normalized.toFixed(normalized >= 100 ? 0 : normalized >= 10 ? 1 : 2)} ${units[exp]}`
}

function getHostKey(series: MetricSeries) {
  return series.instance || series.service || 'unknown-host'
}

function filterSeries(series: MetricSeries[], name: string, envFilter: string) {
  return series.filter(s => s.name.includes(name) && filterByEnv(s, envFilter))
}

function filterJvmSeries(series: MetricSeries[], name: string, envFilter: string) {
  return series.filter(s => {
    if (!(s.name.includes(name) || s.name.endsWith(name.replace('app_', '')))) return false
    if (envFilter === 'all') return true
    const env = (s as MetricSeries & { env?: string }).env
    return env ? env === envFilter : false
  })
}

function toMbSeries(series?: MetricSeries): MetricSeries | undefined {
  if (!series) return undefined
  return { ...series, points: series.points.map(p => ({ ...p, value: p.value / BYTES_PER_MB })) }
}

export default function InfraTab({ envFilter }: Props) {
  const theme = useTheme()

  const { data: containerMetrics = [], isLoading: isContainerLoading } = useQuery({
    queryKey: ['container-metrics'],
    queryFn: getContainerMetrics,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnMount: 'always',
  })

  const { data: hostMetrics = [], isLoading: isHostLoading } = useQuery({
    queryKey: ['host-metrics'],
    queryFn: getHostMetrics,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnMount: 'always',
  })

  const { data: jvmMetrics = [], isLoading: isJvmLoading } = useQuery({
    queryKey: ['jvm-metrics'],
    queryFn: getJvmMetrics,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnMount: 'always',
  })

  const containerCpuSeries = filterSeries(containerMetrics, 'app_container_cpu_utilization_avg_5m', envFilter)
  const containerMemSeries = filterSeries(containerMetrics, 'app_container_memory_utilization_avg_5m', envFilter)
  const containerServices = [...new Set([...containerCpuSeries, ...containerMemSeries].map(s => s.service).filter(Boolean))] as string[]

  const hostMemSeries = filterSeries(hostMetrics, 'host_memory_usage_avg_5m', envFilter)
  const hostNetRxSeries = filterSeries(hostMetrics, 'host_network_rx_bytes_5m', envFilter)
  const hostNetTxSeries = filterSeries(hostMetrics, 'host_network_tx_bytes_5m', envFilter)
  const hostInstances = [...new Set([...hostMemSeries, ...hostNetRxSeries, ...hostNetTxSeries].map(getHostKey).filter(Boolean))] as string[]

  const jvmCpuSeries = filterJvmSeries(jvmMetrics, 'app_jvm_cpu_utilization_pct_avg_5m', envFilter)
  const jvmMemSeries = filterJvmSeries(jvmMetrics, 'app_jvm_memory_used_avg_5m', envFilter)
  const jvmGcCountSeries = filterJvmSeries(jvmMetrics, 'app_jvm_gc_count_5m', envFilter)
  const jvmGcDurSeries = filterJvmSeries(jvmMetrics, 'app_jvm_gc_duration_p95_5m', envFilter)
  const jvmServices = [...new Set([...jvmCpuSeries, ...jvmMemSeries, ...jvmGcCountSeries, ...jvmGcDurSeries].map(s => s.service).filter(Boolean))] as string[]

  if (isContainerLoading || isHostLoading || isJvmLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[180, 180, 180].map((h, i) => (
          <Paper key={i} variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Skeleton variant="text" width={160} height={24} />
            <Skeleton variant="rounded" height={h} sx={{ mt: 1 }} />
          </Paper>
        ))}
      </Box>
    )
  }

  if (containerServices.length === 0 && hostInstances.length === 0 && jvmServices.length === 0) {
    return <NoDataState title="No Infra data" description="No infrastructure metrics available." />
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Container CPU / Memory */}
      {containerServices.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <SectionLabel>Container</SectionLabel>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {containerServices.map(svc => {
              const cpu = containerCpuSeries.find(s => s.service === svc)
              const mem = containerMemSeries.find(s => s.service === svc)
              return (
                <Paper key={svc} variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 1, flex: '1 1 220px', minWidth: 0 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1, display: 'block', mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {svc.toUpperCase()}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    {cpu && (
                      <Box sx={{ flex: '1 1 120px', minWidth: 0 }}>
                        <MetricCard series={cpu} label="CPU avg (5m)" unit="%" color={theme.palette.success.main} />
                      </Box>
                    )}
                    {mem && (
                      <Box sx={{ flex: '1 1 120px', minWidth: 0 }}>
                        <MetricCard series={mem} label="Memory avg (5m)" unit="%" color={theme.palette.secondary.main} />
                      </Box>
                    )}
                  </Box>
                </Paper>
              )
            })}
          </Box>
        </Paper>
      )}

      {/* Host */}
      {hostInstances.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <SectionLabel>Host</SectionLabel>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {hostInstances.map(host => {
              const mem = hostMemSeries.find(s => getHostKey(s) === host)
              const rx = hostNetRxSeries.find(s => getHostKey(s) === host)
              const tx = hostNetTxSeries.find(s => getHostKey(s) === host)
              const memVal = getSeriesLast(mem)
              const rxVal = getSeriesLast(rx)
              const txVal = getSeriesLast(tx)
              return (
                <Paper key={host} variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 1, flex: '1 1 220px', minWidth: 0 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1, display: 'block', mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {host.toUpperCase()}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    {mem && (
                      <Box sx={{ flex: '1 1 120px', minWidth: 0 }}>
                        <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1, display: 'block', mb: 0.5 }}>Memory avg (5m)</Typography>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>{formatBytes(memVal)}</Typography>
                          <MiniSparkline series={{ ...mem, points: sliceLast5Min(mem.points) }} color={theme.palette.secondary.main} />
                        </Paper>
                      </Box>
                    )}
                    {rx && (
                      <Box sx={{ flex: '1 1 120px', minWidth: 0 }}>
                        <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1, display: 'block', mb: 0.5 }}>Network RX (5m)</Typography>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.info.main }}>{formatBytes(rxVal)}</Typography>
                          <MiniSparkline series={{ ...rx, points: sliceLast5Min(rx.points) }} color={theme.palette.info.main} />
                        </Paper>
                      </Box>
                    )}
                    {tx && (
                      <Box sx={{ flex: '1 1 120px', minWidth: 0 }}>
                        <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1, display: 'block', mb: 0.5 }}>Network TX (5m)</Typography>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.info.dark }}>{formatBytes(txVal)}</Typography>
                          <MiniSparkline series={{ ...tx, points: sliceLast5Min(tx.points) }} color={theme.palette.info.dark} />
                        </Paper>
                      </Box>
                    )}
                  </Box>
                </Paper>
              )
            })}
          </Box>
        </Paper>
      )}

      {/* JVM */}
      {jvmServices.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <SectionLabel>JVM</SectionLabel>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {jvmServices.map(svc => {
              const cpu = jvmCpuSeries.find(s => s.service === svc)
              const mem = toMbSeries(jvmMemSeries.find(s => s.service === svc))
              const gcCount = jvmGcCountSeries.find(s => s.service === svc)
              const gcDur = jvmGcDurSeries.find(s => s.service === svc)
              return (
                <Paper key={svc} variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 1, flex: '1 1 220px', minWidth: 0 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1, display: 'block', mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {svc.toUpperCase()}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    {cpu && <Box sx={{ flex: '1 1 120px', minWidth: 0 }}><MetricCard series={cpu} label="CPU avg (5m)" unit="%" color={theme.palette.warning.main} /></Box>}
                    {mem && <Box sx={{ flex: '1 1 120px', minWidth: 0 }}><MetricCard series={mem} label="Memory avg (5m)" unit=" MB" color={theme.palette.info.main} /></Box>}
                    {gcCount && <Box sx={{ flex: '1 1 120px', minWidth: 0 }}><MetricCard series={gcCount} label="GC Count (5m)" unit="" color={theme.palette.secondary.main} /></Box>}
                    {gcDur && <Box sx={{ flex: '1 1 120px', minWidth: 0 }}><MetricCard series={gcDur} label="GC Duration p95 (5m)" unit=" ms" color={theme.palette.error.main} /></Box>}
                  </Box>
                </Paper>
              )
            })}
          </Box>
        </Paper>
      )}
    </Box>
  )
}
