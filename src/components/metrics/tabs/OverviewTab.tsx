'use client'

import { Box, Paper, Skeleton } from '@mui/material'
import type { MetricSeries } from '@/lib/types'
import NoDataState from '@/components/common/NoDataState'
import ErrorRateChart from '@/components/overview/ErrorRateChart'
import ServiceHeatmap from '@/components/overview/ServiceHeatmap'
import OverviewLatencyRank from './OverviewLatencyRank'

type ServiceHealth = {
  service: string
  env?: string
  error_rate: number
  rds_cpu?: number
  rds_connections?: number
  rds_freeable_memory?: number
  rds_read_latency?: number
  rds_write_latency?: number
}

interface Props {
  serviceHealth: ServiceHealth[]
  error4xxSeries: MetricSeries[]
  error5xxSeries: MetricSeries[]
  envFilter: string
  metricSeries?: MetricSeries[]
  isLoading?: boolean
}

export default function OverviewTab({
  serviceHealth,
  error4xxSeries,
  error5xxSeries,
  envFilter,
  metricSeries = [],
  isLoading,
}: Props) {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Paper
          variant="outlined"
          sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}
        >
          <Skeleton variant="rounded" height={240} />
        </Paper>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Skeleton variant="rounded" height={280} sx={{ flex: 1 }} />
          <Skeleton variant="rounded" height={280} sx={{ flex: '0 0 340px' }} />
        </Box>
      </Box>
    )
  }

  const services = serviceHealth.filter(h => !h.rds_cpu)
  const filtered = services.filter(h => envFilter === 'all' || h.env === envFilter)

  if (filtered.length === 0 && metricSeries.length === 0) {
    return (
      <NoDataState
        title="No metric data"
        description="No data available for the selected environment."
      />
    )
  }

  // error4xx/5xx를 serviceHealth 형태로 병합해서 ErrorRateChart에 전달
  const enrichedHealth = filtered.map(h => ({
    ...h,
    _4xx: error4xxSeries.find(s => s.service === h.service),
    _5xx: error5xxSeries.find(s => s.service === h.service),
  }))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 에러율 추이 차트 */}
      <ErrorRateChart
        serviceHealth={filtered}
        metricSeries={[...error4xxSeries, ...error5xxSeries, ...metricSeries]}
      />

      {/* 히트맵 + 레이턴시 랭킹 */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch' }}>
        <ServiceHeatmap serviceHealth={serviceHealth} />
        <OverviewLatencyRank metricSeries={metricSeries} envFilter={envFilter} />
      </Box>
    </Box>
  )
}
