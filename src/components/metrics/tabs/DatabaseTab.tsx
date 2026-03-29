'use client'

import { Box, Paper, Typography, useTheme } from '@mui/material'
import type { MetricSeries } from '@/lib/types'
import NoDataState from '@/components/common/NoDataState'
import { getSeriesLast, sliceLast5Min } from '../metricsUtils'
import { MiniSparkline, SectionLabel } from '../MetricsShared'

interface Props {
  metricSeries: MetricSeries[]
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

export default function DatabaseTab({ metricSeries, envFilter }: Props) {
  const theme = useTheme()

  // 기존 p95 시리즈
  const useP95Series = filterSeries(metricSeries, 'db_connection_use', envFilter)
  const waitP95Series = filterSeries(metricSeries, 'db_connection_wait', envFilter)

  // db_client_connections_* 시리즈
  const usageSeries = filterSeries(metricSeries, 'db_client_connections_usage', envFilter)
  const pendingSeries = filterSeries(metricSeries, 'db_client_connections_pending_requests', envFilter)
  const maxSeries = filterSeries(metricSeries, 'db_client_connections_max', envFilter)

  // 서비스 목록 추출 (모든 시리즈에서)
  const services = [
    ...new Set([
      ...useP95Series,
      ...waitP95Series,
      ...usageSeries,
      ...pendingSeries,
      ...maxSeries,
    ].map(s => s.service).filter(Boolean))
  ] as string[]

  if (services.length === 0) {
    return <NoDataState title="No Database data" description="No DB connection metrics available." />
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {services.map(svc => {
        const useP95 = useP95Series.find(s => s.service === svc)
        const waitP95 = waitP95Series.find(s => s.service === svc)
        const usage = usageSeries.find(s => s.service === svc)
        const pending = pendingSeries.find(s => s.service === svc)
        const max = maxSeries.find(s => s.service === svc)
        return (
          <Paper key={svc} variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <SectionLabel>{svc.toUpperCase()}</SectionLabel>
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
    </Box>
  )
}
