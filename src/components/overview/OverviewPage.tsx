'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Box, Typography } from '@mui/material'
import { apiClient, getLogs } from '@/lib/apiClient'
import type { MetricSeries, Trace, LogEntry } from '@/lib/types'
import StatusBanner from './StatusBanner'
import KpiRow from './KpiRow'
import ErrorRateChart from './ErrorRateChart'
import ServiceHeatmap from './ServiceHeatmap'
import ActivityFeed from './ActivityFeed'
import PlatformNavCards from './PlatformNavCards'

type ServiceHealth = { service: string; env?: string; error_rate: number; rds_cpu?: number }

const EMPTY_ARRAY: never[] = []

export default function OverviewPage() {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1)
    setLastUpdated(new Date())
  }, [])

  const { data: serviceHealth = EMPTY_ARRAY as ServiceHealth[], isLoading: isHealthLoading } =
    useQuery({
      queryKey: ['metric-health', refreshKey],
      queryFn: async () => {
        const data = await apiClient.getMetricServiceHealth()
        setLastUpdated(new Date())
        return data as ServiceHealth[]
      },
      staleTime: 30_000,
      refetchInterval: 30_000,
    })

  const { data: metricsData = EMPTY_ARRAY as MetricSeries[], isLoading: isMetricsLoading } =
    useQuery({
      queryKey: ['metrics', refreshKey],
      queryFn: apiClient.getMetrics,
      staleTime: 30_000,
      refetchInterval: 30_000,
    })

  const { data: tracesData, isLoading: isTracesLoading } = useQuery({
    queryKey: ['traces', refreshKey],
    queryFn: apiClient.getTraces,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
  const traces: Trace[] = tracesData ?? (EMPTY_ARRAY as Trace[])

  const { data: errorLogsData, isLoading: isLogsLoading } = useQuery({
    queryKey: ['overview-error-logs', refreshKey],
    queryFn: () => getLogs({ level: 'ERROR', limit: 20 }),
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
  const errorLogs: LogEntry[] = errorLogsData ?? (EMPTY_ARRAY as LogEntry[])

  const { data: slackStatus } = useQuery({
    queryKey: ['slack-integration'],
    queryFn: () => apiClient.getSlackIntegration().catch(() => null),
    staleTime: 60_000,
  })

  const errorTraces = traces.filter(t => t.status === 'error')
  const serviceCount = [...new Set(serviceHealth.filter(h => !h.rds_cpu).map(h => h.service))]
    .length
  const isLoading = isHealthLoading || isMetricsLoading

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
          Overview
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Real-time health across all services and infrastructure
        </Typography>
      </Box>

      {/* ① Status Banner */}
      <StatusBanner
        serviceHealth={serviceHealth}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        lastUpdated={lastUpdated}
      />

      {/* ② KPI Row */}
      <KpiRow
        serviceHealth={serviceHealth}
        metricSeries={metricsData}
        traces={traces}
        errorLogs={errorLogs}
        isLoading={isLoading || isTracesLoading || isLogsLoading}
      />

      {/* ③ Error Rate Chart + ④ Heatmap */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch' }}>
        <ErrorRateChart serviceHealth={serviceHealth} metricSeries={metricsData} />
        <ServiceHeatmap serviceHealth={serviceHealth} />
      </Box>

      {/* ⑤ Activity Feed + ⑥ Platform Nav */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch' }}>
        <ActivityFeed errorLogs={errorLogs} errorTraces={errorTraces} />
        <PlatformNavCards
          errorLogs={errorLogs}
          traces={traces}
          serviceCount={serviceCount}
          slackConnected={slackStatus?.connected ?? false}
        />
      </Box>
    </Box>
  )
}
