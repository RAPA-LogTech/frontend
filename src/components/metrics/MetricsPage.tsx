'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material'
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts'
import type { MetricSeries } from '@/lib/types'
import { apiClient } from '@/lib/apiClient'
import NoDataState from '@/components/common/NoDataState'
import LiveButton from '@/components/logs/LogFilters/LiveButton'

type MetricStreamPayload = {
  cursor: number
  ts: number
  points: Array<{ id: string; ts: number; value: number }>
}

const EMPTY_METRICS: MetricSeries[] = []

const getSeriesLast = (series?: MetricSeries) =>
  series ? (series.points[series.points.length - 1]?.value ?? 0) : 0

const getSeriesAvg = (series?: MetricSeries) => {
  if (!series || series.points.length === 0) return 0
  return series.points.reduce((s, p) => s + p.value, 0) / series.points.length
}

function StatusBadge({ value }: { value: number }) {
  const isWarn = value > 1
  return (
    <Chip
      label={isWarn ? '주의' : '정상'}
      size="small"
      color={isWarn ? 'warning' : 'success'}
      variant="outlined"
      sx={{ height: 20, fontSize: 11, fontWeight: 700, borderRadius: 1, px: 0.25 }}
    />
  )
}

function EnvBadge({ env }: { env: string }) {
  const isProd = env === 'prod'
  return (
    <Chip
      label={env.toUpperCase()}
      size="small"
      color={isProd ? 'info' : 'secondary'}
      variant="outlined"
      sx={{ height: 18, fontSize: 10, fontWeight: 700, borderRadius: 0.75, px: 0.25 }}
    />
  )
}

function MiniSparkline({ series, color }: { series: MetricSeries; color: string }) {
  if (series.points.length === 0) return <Box sx={{ height: 48 }} />
  const values = series.points.map(p => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const spread = Math.max(1, max - min)
  const data = series.points.map((p, i) => ({ i, v: p.value }))
  return (
    <Box sx={{ height: 48, width: '100%', mt: 1 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`sg-${series.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <YAxis hide domain={[Math.max(0, min - spread * 0.1), max + spread * 0.1]} />
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            fill={`url(#sg-${series.id})`}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  const theme = useTheme()
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
      <Box sx={{ width: 3, height: 16, bgcolor: 'primary.main', borderRadius: 1 }} />
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1 }}
      >
        {children}
      </Typography>
    </Box>
  )
}

function ServiceHealthCard({
  service,
  envs,
  errorRate,
}: {
  service: string
  envs: string[]
  errorRate: number
}) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 1 }}
    >
      <Stack direction="row" spacing={0.75} alignItems="center" mb={0.5} flexWrap="wrap">
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1 }}
        >
          {service.toUpperCase()}
        </Typography>
        {envs.map(env => (
          <EnvBadge key={env} env={env} />
        ))}
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {errorRate.toFixed(1)}%
        </Typography>
        <StatusBadge value={errorRate} />
      </Stack>
      <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.25, display: 'block' }}>
        HTTP error ratio (5m)
      </Typography>
    </Paper>
  )
}

function MetricBigCard({
  series,
  label,
  sublabel,
  color,
}: {
  series?: MetricSeries
  label: string
  sublabel: string
  color: string
}) {
  const value = getSeriesLast(series)
  const unit = series?.unit ?? ''

  const formatted = (() => {
    if (unit === 'req/s')
      return `${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value.toFixed(0)} req/5m`
    if (unit === '%') return `${value.toFixed(0)} err/5m`
    if (unit === 'ms') return `${value.toFixed(0)} ms`
    return value.toFixed(1)
  })()

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        borderRadius: 1,
        height: '100%',
      }}
    >
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1, display: 'block' }}
      >
        {label}
      </Typography>
      <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
        {formatted}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {sublabel}
      </Typography>
      {series && <MiniSparkline series={series} color={color} />}
    </Paper>
  )
}

function InfraCard({
  series,
  label,
  color,
}: {
  series?: MetricSeries
  label: string
  color: string
}) {
  const value = getSeriesLast(series)
  const queryLabel = series?.name ?? ''
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 1 }}
    >
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1, display: 'block' }}
      >
        {label}
      </Typography>
      <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
        {value.toFixed(0)}%
      </Typography>
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', wordBreak: 'break-all', display: 'block' }}
      >
        {queryLabel}
      </Typography>
      {series && <MiniSparkline series={series} color={color} />}
    </Paper>
  )
}

export default function MetricsPage() {
  const theme = useTheme()
  const [tab, setTab] = useState(0)

  const { data: serviceList = [] } = useQuery({
    queryKey: ['metric-services'],
    queryFn: apiClient.getMetricServices,
    staleTime: 60_000,
  })

  const { data: serviceHealth = [] } = useQuery({
    queryKey: ['metric-health'],
    queryFn: apiClient.getMetricHealth,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })

  const tabs = ['Overview', ...(serviceList?.length ? serviceList : [])]

  const {
    data: metricsData,
    isLoading,
    isFetched,
  } = useQuery({
    queryKey: ['metrics'],
    queryFn: apiClient.getMetrics,
  })
  const metrics = metricsData ?? EMPTY_METRICS

  const [liveMetrics, setLiveMetrics] = useState<MetricSeries[]>([])
  const [isLiveEnabled, setIsLiveEnabled] = useState(true)
  const [streamStatus, setStreamStatus] = useState<
    'connecting' | 'live' | 'reconnecting' | 'offline'
  >('connecting')
  const lastCursorRef = useRef(0)

  useEffect(() => {
    if (metrics.length > 0) setLiveMetrics(prev => (prev.length === 0 ? metrics : prev))
  }, [metrics, isLiveEnabled])

  useEffect(() => {
    if (!isLiveEnabled) {
      setStreamStatus('offline')
      return
    }

    const MAX_POINTS = 120
    let es: EventSource | null = null
    let timer: ReturnType<typeof setTimeout> | null = null
    let unmounted = false
    let retry = 0

    const apply = (payload: MetricStreamPayload) => {
      const map = new Map(payload.points.map(p => [p.id, p]))
      setLiveMetrics(prev =>
        prev.map(s => {
          const next = map.get(s.id)
          if (!next) return s
          const pts = [...s.points, { ts: next.ts, value: next.value }]
          return {
            ...s,
            points: pts.length > MAX_POINTS ? pts.slice(pts.length - MAX_POINTS) : pts,
          }
        })
      )
      lastCursorRef.current = Math.max(lastCursorRef.current, payload.cursor ?? 0)
    }

    const fetchBacklog = async () => {
      let cursor = lastCursorRef.current
      for (let i = 0; i < 10; i++) {
        try {
          const res = await fetch(`/api/metrics/backlog?cursor=${cursor}&limit=200`)
          if (!res.ok) return
          const data = (await res.json()) as {
            events?: MetricStreamPayload[]
            nextCursor?: number
            hasMore?: boolean
            latestCursor?: number
          }
          ;(data.events ?? []).forEach(apply)
          cursor = Math.max(cursor, data.nextCursor ?? cursor)
          lastCursorRef.current = Math.max(lastCursorRef.current, data.latestCursor ?? cursor)
          if (!data.hasMore) break
        } catch {
          break
        }
      }
    }

    const connect = async () => {
      if (unmounted) return
      setStreamStatus(retry === 0 ? 'connecting' : 'reconnecting')
      await fetchBacklog()
      if (unmounted) return
      es = new EventSource('/api/metrics/stream')
      es.onopen = () => {
        retry = 0
        setStreamStatus('live')
      }
      es.addEventListener('metric', e => {
        try {
          apply(JSON.parse((e as MessageEvent<string>).data))
        } catch {}
      })
      es.onerror = () => {
        es?.close()
        es = null
        if (unmounted) return
        setStreamStatus('reconnecting')
        retry++
        timer = setTimeout(connect, Math.min(5000, 1000 * 2 ** Math.min(retry, 3)))
      }
    }

    connect()
    return () => {
      unmounted = true
      setStreamStatus('offline')
      if (timer) clearTimeout(timer)
      es?.close()
    }
  }, [isLiveEnabled])

  const metricSeries = useMemo(
    () => (liveMetrics.length > 0 ? liveMetrics : metrics),
    [liveMetrics, metrics]
  )

  const selectedService = tab === 0 ? null : tabs[tab]

  const errorSeries = metricSeries.filter(
    s => s.name.includes('error_rate') && (!selectedService || s.service === selectedService)
  )
  const requestSeries = metricSeries.filter(
    s => s.name.includes('request_rate') && (!selectedService || s.service === selectedService)
  )
  const latencySeries = metricSeries.filter(
    s => s.name.includes('latency_p95') && (!selectedService || s.service === selectedService)
  )
  const cpuSeries = metricSeries.filter(
    s => s.name.includes('cpu_usage') && (!selectedService || s.service === selectedService)
  )
  const memorySeries = metricSeries.filter(
    s => s.name.includes('memory_usage') && (!selectedService || s.service === selectedService)
  )

  const services =
    serviceList.length > 0
      ? serviceList
      : ([...new Set(metricSeries.map(s => s.service).filter(Boolean))] as string[])

  const sumSeries = (list: MetricSeries[], id: string, unit: string): MetricSeries | undefined => {
    if (list.length === 0) return undefined
    const len = Math.max(...list.map(s => s.points.length))
    const points = Array.from({ length: len }, (_, i) => ({
      ts: list[0].points[i]?.ts ?? 0,
      value: list.reduce((sum, s) => sum + (s.points[i]?.value ?? 0), 0),
    }))
    return { id, name: id, unit, points }
  }

  const reqSum = sumSeries(requestSeries, 'total_request_rate', 'req/s')
  const errSum = sumSeries(errorSeries, 'total_error_rate', '%')
  const latMax = latencySeries[0]

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Metrics
          </Typography>
          <Skeleton variant="rounded" width={80} height={28} />
        </Stack>
        <Grid container spacing={2}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={120} />
            </Grid>
          ))}
        </Grid>
      </Box>
    )
  }
  console.log(serviceHealth)
  if (isFetched && metricSeries.length === 0) {
    return (
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Metrics
        </Typography>
        <NoDataState title="No metrics data" description="No metrics data found." />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* 헤더 */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Metrics
          </Typography>
        </Box>
        <LiveButton
          value={isLiveEnabled}
          onChange={setIsLiveEnabled}
          isStreaming={streamStatus === 'live'}
        />
      </Stack>

      {/* 탭 */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: 36,
          '& .MuiTab-root': {
            minHeight: 36,
            py: 0.5,
            px: 2,
            fontSize: 13,
            fontWeight: 600,
            color: 'text.secondary',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            mr: 0.75,
            '&.Mui-selected': {
              color: 'text.primary',
              bgcolor: 'action.selected',
            },
          },
          '& .MuiTabs-indicator': { display: 'none' },
        }}
      >
        {tabs.map(t => (
          <Tab key={t} label={t} disableRipple />
        ))}
      </Tabs>

      {/* 서비스 헬스 — Overview 탭에서만 표시 */}
      {tab === 0 && (
        <Paper
          variant="outlined"
          sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}
        >
          <SectionLabel>Service Health</SectionLabel>
          <Grid container spacing={1.5}>
            {serviceHealth.length > 0
              ? serviceHealth.map(h => (
                  <Grid item xs={12} sm={6} md={3} key={h.service}>
                    <ServiceHealthCard service={h.service} envs={h.envs} errorRate={h.error_rate} />
                  </Grid>
                ))
              : errorSeries.map(s => (
                  <Grid item xs={12} sm={6} md={3} key={s.id}>
                    <ServiceHealthCard
                      service={s.service ?? s.id.split('_')[0]}
                      envs={['prod']}
                      errorRate={getSeriesLast(s)}
                    />
                  </Grid>
                ))}
          </Grid>
        </Paper>
      )}

      {/* 요청량 / 레이턴시 */}
      <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <SectionLabel>Request Rate / Latency</SectionLabel>
        <Box sx={{ overflowX: 'auto', pb: 1 }}>
          <Stack direction="row" spacing={1.5} sx={{ minWidth: 'min-content' }}>
            {requestSeries.map(s => (
              <Box key={s.id} sx={{ minWidth: 220, maxWidth: 260, flex: '0 0 auto' }}>
                <MetricBigCard
                  series={s}
                  label={s.name}
                  sublabel={s.service ?? 'all'}
                  color={theme.palette.info.main}
                />
              </Box>
            ))}
            {errorSeries.map(s => (
              <Box key={s.id} sx={{ minWidth: 220, maxWidth: 260, flex: '0 0 auto' }}>
                <MetricBigCard
                  series={s}
                  label={s.name}
                  sublabel={s.service ?? 'all'}
                  color={theme.palette.error.main}
                />
              </Box>
            ))}
            {latencySeries.map(s => (
              <Box key={s.id} sx={{ minWidth: 220, maxWidth: 260, flex: '0 0 auto' }}>
                <MetricBigCard
                  series={s}
                  label={s.name}
                  sublabel={s.service ?? 'all'}
                  color={theme.palette.warning.main}
                />
              </Box>
            ))}
          </Stack>
        </Box>
      </Paper>

      {/* 인프라 요약 */}
      <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <SectionLabel>Infrastructure Summary</SectionLabel>
        <Box sx={{ overflowX: 'auto', pb: 1 }}>
          <Stack direction="row" spacing={1.5} sx={{ minWidth: 'min-content' }}>
            {cpuSeries.map(s => (
              <Box key={s.id} sx={{ minWidth: 220, maxWidth: 260, flex: '0 0 auto' }}>
                <InfraCard series={s} label="CONTAINER CPU (AVG)" color={theme.palette.success.main} />
              </Box>
            ))}
            {memorySeries.map(s => (
              <Box key={s.id} sx={{ minWidth: 220, maxWidth: 260, flex: '0 0 auto' }}>
                <InfraCard series={s} label="CONTAINER MEMORY (AVG)" color={theme.palette.secondary.main} />
              </Box>
            ))}
          </Stack>
        </Box>
      </Paper>
    </Box>
  )
}
