'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Box, Chip, Paper, Skeleton, Stack, Tab, Tabs, Typography } from '@mui/material'
import type { MetricSeries } from '@/lib/types'
import { apiClient, getContainerMetrics, getHostMetrics } from '@/lib/apiClient'
import NoDataState from '@/components/common/NoDataState'
import LiveButton from '@/components/logs/LogFilters/LiveButton'
import { filterByEnv } from './metricsUtils'
import OverviewTab from './tabs/OverviewTab'
import JvmTab from './tabs/JvmTab'
import DatabaseTab from './tabs/DatabaseTab'
import InfraTab from './tabs/InfraTab'

type MetricStreamPayload = {
  cursor: number
  ts: number
  points: Array<{ id: string; ts: number; value: number }>
}

const EMPTY_METRICS: MetricSeries[] = []
const TABS = ['Overview', 'JVM', 'Database', 'Infra'] as const

export default function MetricsPage() {
  const [tab, setTab] = useState(0)
  const [envFilter, setEnvFilter] = useState<'all' | 'dev' | 'prod'>('all')

  const { data: serviceHealth = [] } = useQuery({
    queryKey: ['metric-health'],
    queryFn: apiClient.getMetricHealth,
    staleTime: 30_000,
    refetchInterval: 30_000,
    placeholderData: (prev) => prev,
  })

  const { data: metricsData, isLoading, isFetched } = useQuery({
    queryKey: ['metrics'],
    queryFn: apiClient.getMetrics,
  })
  const metrics = metricsData ?? EMPTY_METRICS


  // 컨테이너/호스트 메트릭 분리 패칭
  const { data: containerMetricsData = EMPTY_METRICS } = useQuery({
    queryKey: ['container-metrics'],
    queryFn: getContainerMetrics,
    staleTime: 30_000,
    refetchInterval: 30_000,
    placeholderData: (prev) => prev,
  })
  const { data: hostMetricsData = EMPTY_METRICS } = useQuery({
    queryKey: ['host-metrics'],
    queryFn: getHostMetrics,
    staleTime: 30_000,
    refetchInterval: 30_000,
    placeholderData: (prev) => prev,
  })

  const [liveMetrics, setLiveMetrics] = useState<MetricSeries[]>([])
  const [isLiveEnabled, setIsLiveEnabled] = useState(true)
  const [streamStatus, setStreamStatus] = useState<'connecting' | 'live' | 'reconnecting' | 'offline'>('connecting')
  const lastCursorRef = useRef(0)

  useEffect(() => {
    if (metrics.length > 0) setLiveMetrics(prev => (prev.length === 0 ? metrics : prev))
  }, [metrics])

  useEffect(() => {
    if (!isLiveEnabled) { setStreamStatus('offline'); return }

    const MAX_POINTS = 120
    let es: EventSource | null = null
    let timer: ReturnType<typeof setTimeout> | null = null
    let unmounted = false
    let retry = 0

    const apply = (payload: MetricStreamPayload) => {
      const map = new Map(payload.points.map(p => [p.id, p]))
      setLiveMetrics(prev => prev.map(s => {
        const next = map.get(s.id)
        if (!next) return s
        const pts = [...s.points, { ts: next.ts, value: next.value }]
        return { ...s, points: pts.length > MAX_POINTS ? pts.slice(pts.length - MAX_POINTS) : pts }
      }))
      lastCursorRef.current = Math.max(lastCursorRef.current, payload.cursor ?? 0)
    }

    const fetchBacklog = async () => {
      let cursor = lastCursorRef.current
      for (let i = 0; i < 10; i++) {
        try {
          const res = await fetch(`/api/observability/metrics/backlog?cursor=${cursor}&limit=200`)
          if (!res.ok) return
          const data = await res.json() as { events?: MetricStreamPayload[]; nextCursor?: number; hasMore?: boolean; latestCursor?: number }
          ;(data.events ?? []).forEach(apply)
          cursor = Math.max(cursor, data.nextCursor ?? cursor)
          lastCursorRef.current = Math.max(lastCursorRef.current, data.latestCursor ?? cursor)
          if (!data.hasMore) break
        } catch { break }
      }
    }

    const connect = async () => {
      if (unmounted) return
      setStreamStatus(retry === 0 ? 'connecting' : 'reconnecting')
      await fetchBacklog()
      if (unmounted) return
      es = new EventSource('/api/observability/metrics/stream')
      es.onopen = () => { retry = 0; setStreamStatus('live') }
      es.addEventListener('metric', e => { try { apply(JSON.parse((e as MessageEvent<string>).data)) } catch {} })
      es.onerror = () => {
        es?.close(); es = null
        if (unmounted) return
        setStreamStatus('reconnecting'); retry++
        timer = setTimeout(connect, Math.min(5000, 1000 * 2 ** Math.min(retry, 3)))
      }
    }

    connect()
    return () => { unmounted = true; setStreamStatus('offline'); if (timer) clearTimeout(timer); es?.close() }
  }, [isLiveEnabled])

  const metricSeries = useMemo(() => (liveMetrics.length > 0 ? liveMetrics : metrics), [liveMetrics, metrics])

  const error4xxSeries = metricSeries.filter(s => s.name.includes('4xx_ratio') && filterByEnv(s, envFilter))
  const error5xxSeries = metricSeries.filter(s => s.name.includes('5xx_ratio') && filterByEnv(s, envFilter))

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Metrics</Typography>
          <Skeleton variant="rounded" width={80} height={28} />
        </Stack>
        <Stack direction="row" gap={0.75}>
          {TABS.map((_, i) => <Skeleton key={i} variant="rounded" width={80} height={36} />)}
        </Stack>
        <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider' }}>
          <Skeleton variant="rounded" height={200} />
        </Paper>
      </Box>
    )
  }

  if (isFetched && metricSeries.length === 0) {
    return (
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Metrics</Typography>
        <NoDataState title="No metrics data" description="No metrics data found." />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Metrics</Typography>
        <Stack direction="row" gap={1} alignItems="center">
          <Stack direction="row" gap={0.5}>
            {(['all', 'dev', 'prod'] as const).map(e => (
              <Chip
                key={e}
                label={e === 'all' ? 'ALL' : e.toUpperCase()}
                size="small"
                onClick={() => setEnvFilter(e)}
                color={envFilter === e ? (e === 'prod' ? 'info' : e === 'dev' ? 'secondary' : 'default') : 'default'}
                variant={envFilter === e ? 'filled' : 'outlined'}
                sx={{ fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
              />
            ))}
          </Stack>
          <LiveButton value={isLiveEnabled} onChange={setIsLiveEnabled} isStreaming={streamStatus === 'live'} />
        </Stack>
      </Stack>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: 36,
          '& .MuiTab-root': {
            minHeight: 36, py: 0.5, px: 2, fontSize: 13, fontWeight: 600,
            color: 'text.secondary', border: '1px solid', borderColor: 'divider', borderRadius: 1, mr: 0.75,
            '&.Mui-selected': { color: 'text.primary', bgcolor: 'action.selected' },
          },
          '& .MuiTabs-indicator': { display: 'none' },
        }}
      >
        {TABS.map(t => <Tab key={t} label={t} disableRipple />)}
      </Tabs>

      {tab === 0 && (
        <OverviewTab
          serviceHealth={serviceHealth}
          error4xxSeries={error4xxSeries}
          error5xxSeries={error5xxSeries}
          envFilter={envFilter}
          metricSeries={metricSeries}
        />
      )}
      {tab === 1 && <JvmTab metricSeries={metricSeries} envFilter={envFilter} />}
      {tab === 2 && (
        <DatabaseTab
          metricSeries={metricSeries}
          envFilter={envFilter}
          serviceHealth={serviceHealth}
        />
      )}
      {tab === 3 && (
        <InfraTab
          containerMetrics={containerMetricsData}
          hostMetrics={hostMetricsData}
          serviceHealth={serviceHealth}
          envFilter={envFilter}
        />
      )}
    </Box>
  )
}
