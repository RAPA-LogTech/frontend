'use client'

import { Box, Paper, Skeleton, Typography, useTheme } from '@mui/material'
import type { MetricSeries } from '@/lib/types'
import NoDataState from '@/components/common/NoDataState'
import { getSeriesLast, sliceLast5Min } from '../metricsUtils'
import { MiniSparkline, SectionLabel } from '../MetricsShared'

interface Props {
  metricSeries: MetricSeries[];
  rdsMetrics: MetricSeries[];
  envFilter: string;
  isLoading?: boolean;
}

const BYTES_PER_MB = 1024 * 1024

function filterSeries(series: MetricSeries[], name: string, envFilter: string) {
  return series.filter(s => {
    if (!s.name.includes(name)) return false
    if (envFilter === 'all') return true
    const env = (s as MetricSeries & { env?: string }).env
    return env ? env === envFilter : false
  })
}

function MetricCard({ series, label, unit, color }: { series?: MetricSeries; label: string; unit: string; color: string }) {
  const val = getSeriesLast(series)
  return (
    <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 1 }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1, display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 700, color }}>
        {val.toFixed(1)}{unit}
      </Typography>
      {series && <MiniSparkline series={{ ...series, points: sliceLast5Min(series.points) }} color={color} />}
    </Paper>
  )
}

function toMbSeries(series?: MetricSeries): MetricSeries | undefined {
  if (!series) return undefined
  return {
    ...series,
    points: series.points.map(point => ({
      ...point,
      value: point.value / BYTES_PER_MB,
    })),
  }
}

export default function DatabaseTab({ metricSeries, rdsMetrics, envFilter, isLoading }: Props) {
  const theme = useTheme()

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Skeleton variant="text" width={180} height={24} />
          <Skeleton variant="rounded" height={180} sx={{ mt: 1 }} />
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Skeleton variant="text" width={120} height={24} />
          <Skeleton variant="rounded" height={180} sx={{ mt: 1 }} />
        </Paper>
      </Box>
    )
  }

  // 기존 p95 시리즈
  const useP95Series = filterSeries(metricSeries, 'db_connection_use', envFilter)
  const waitP95Series = filterSeries(metricSeries, 'db_connection_wait', envFilter)

  // db_client_connections_* 시리즈
  const usageSeries = filterSeries(metricSeries, 'db_client_connections_usage', envFilter)
  const pendingSeries = filterSeries(metricSeries, 'db_client_connections_pending_requests', envFilter)
  const maxSeries = filterSeries(metricSeries, 'db_client_connections_max', envFilter)
  const rdsCpuSeries = rdsMetrics.find(s => s.name === 'rds_cpu_utilization')
  const rdsConnectionsSeries = rdsMetrics.find(s => s.name === 'rds_database_connections')
  const rdsFreeableMemorySeries = toMbSeries(rdsMetrics.find(s => s.name === 'rds_freeable_memory'))
  const rdsReadLatencySeries = rdsMetrics.find(s => s.name === 'rds_read_latency')
  const rdsWriteLatencySeries = rdsMetrics.find(s => s.name === 'rds_write_latency')

  const getGroupKey = (series: MetricSeries) => series.service || 'UNKNOWN_SERVICE'

  // 서비스 목록 추출 (모든 시리즈에서)
  const services = [
    ...new Set([
      ...useP95Series,
      ...waitP95Series,
      ...usageSeries,
      ...pendingSeries,
      ...maxSeries,
    ].map(getGroupKey))
  ]
  const hasRdsMetrics = Boolean(
    rdsCpuSeries ||
    rdsConnectionsSeries ||
    rdsFreeableMemorySeries ||
    rdsReadLatencySeries ||
    rdsWriteLatencySeries
  )

  if (services.length === 0 && !hasRdsMetrics) {
    return <NoDataState title="No Database data" description="No DB connection or RDS metrics available." />
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {services.map(svc => {
        const useP95 = useP95Series.find(s => getGroupKey(s) === svc)
        const waitP95 = waitP95Series.find(s => getGroupKey(s) === svc)
        const usage = usageSeries.find(s => getGroupKey(s) === svc)
        const pending = pendingSeries.find(s => getGroupKey(s) === svc)
        const max = maxSeries.find(s => getGroupKey(s) === svc)
        return (
          <Paper key={svc} variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <SectionLabel>{svc === 'UNKNOWN_SERVICE' ? 'DB CONNECTION POOL' : `DB CONNECTION POOL · ${svc.toUpperCase()}`}</SectionLabel>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              {usage && (
                <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
                  <MetricCard series={usage} label="Active Connections" unit="" color={theme.palette.info.main} />
                </Box>
              )}
              {pending && (
                <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
                  <MetricCard series={pending} label="Pending Requests" unit="" color={theme.palette.warning.main} />
                </Box>
              )}
              {max && (
                <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
                  <MetricCard series={max} label="Max Pool Size" unit="" color={theme.palette.success.main} />
                </Box>
              )}
              {useP95 && (
                <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
                  <MetricCard series={useP95} label="Connection Use p95" unit="ms" color={theme.palette.info.light} />
                </Box>
              )}
              {waitP95 && (
                <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
                  <MetricCard series={waitP95} label="Connection Wait p95" unit="ms" color={theme.palette.warning.light} />
                </Box>
              )}
            </Box>
          </Paper>
        )
      })}

      {/* RDS (CloudWatch) 메트릭 */}
      {hasRdsMetrics && (
        <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <SectionLabel>RDS</SectionLabel>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {rdsCpuSeries && (
              <Box sx={{ flex: '1 1 220px', minWidth: 0, maxWidth: 320 }}>
                <MetricCard series={rdsCpuSeries} label="CPUUtilization" unit="%" color={theme.palette.success.main} />
              </Box>
            )}
            {rdsConnectionsSeries && (
              <Box sx={{ flex: '1 1 220px', minWidth: 0, maxWidth: 320 }}>
                <MetricCard series={rdsConnectionsSeries} label="DatabaseConnections" unit="" color={theme.palette.info.main} />
              </Box>
            )}
            {rdsFreeableMemorySeries && (
              <Box sx={{ flex: '1 1 220px', minWidth: 0, maxWidth: 320 }}>
                <MetricCard series={rdsFreeableMemorySeries} label="FreeableMemory" unit=" MB" color={theme.palette.warning.main} />
              </Box>
            )}
            {rdsReadLatencySeries && (
              <Box sx={{ flex: '1 1 220px', minWidth: 0, maxWidth: 320 }}>
                <MetricCard series={rdsReadLatencySeries} label="ReadLatency" unit="s" color={theme.palette.secondary.main} />
              </Box>
            )}
            {rdsWriteLatencySeries && (
              <Box sx={{ flex: '1 1 220px', minWidth: 0, maxWidth: 320 }}>
                <MetricCard series={rdsWriteLatencySeries} label="WriteLatency" unit="s" color={theme.palette.error.main} />
              </Box>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  )
}
