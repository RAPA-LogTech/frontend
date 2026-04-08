'use client'

import Link from 'next/link'
import { UIEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material'
import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { apiClient } from '@/lib/apiClient'
import { formatTimestamp } from '@/lib/formatters'
import type { Trace } from '@/lib/types'
import NoDataState from '@/components/common/NoDataState'

type SortKey = 'recent' | 'duration'

type TraceStreamPayload = {
  cursor: number
  ts: number
  trace: Trace
}

const EMPTY_TRACES: Trace[] = []

export default function TracesPage() {
  const PAGE_SIZE = 30
  const theme = useTheme()
  const {
    data: tracesData,
    isLoading: isTracesLoading,
    isFetched: isTracesFetched,
  } = useQuery({ queryKey: ['traces'], queryFn: apiClient.getTraces })
  const { data: traceFilterOptionsData } = useQuery({
    queryKey: ['traceFilterOptions'],
    queryFn: apiClient.getTraceFilterOptions,
  })
  const traces = tracesData ?? EMPTY_TRACES
  const [liveTraces, setLiveTraces] = useState<Trace[]>([])
  const [isLiveEnabled, setIsLiveEnabled] = useState(true)
  const [streamStatus, setStreamStatus] = useState<
    'connecting' | 'live' | 'reconnecting' | 'offline'
  >('connecting')
  const lastTraceCursorRef = useRef(0)
  const [sortKey, setSortKey] = useState<SortKey>('recent')
  const [hoveredTraceId, setHoveredTraceId] = useState<string | null>(null)
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [showDependencyGraph, setShowDependencyGraph] = useState(false)
  const [filterService, setFilterService] = useState<string>('all')
  const [filterOperation, setFilterOperation] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterEnvironment, setFilterEnvironment] = useState<string>('all')
  const [chartNow, setChartNow] = useState(() => Math.ceil(Date.now() / 60000) * 60000)

  useEffect(() => {
    const timer = setInterval(() => {
      setChartNow(Math.ceil(Date.now() / 60000) * 60000)
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (traces.length > 0) {
      setLiveTraces(prev => (prev.length === 0 ? traces : prev))
    }

    if (isLiveEnabled) {
      setStreamStatus('connecting')
    }
  }, [traces, isLiveEnabled])

  useEffect(() => {
    if (!isLiveEnabled) {
      setStreamStatus('offline')
      return
    }

    const MAX_TRACES = 240
    let eventSource: EventSource | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let isUnmounted = false
    let retryAttempt = 0

    const applyTracePayload = (payload: TraceStreamPayload) => {
      if (!payload?.trace) return

      setLiveTraces(prev => {
        const deduped = prev.filter(item => item.id !== payload.trace.id)
        return [payload.trace, ...deduped].slice(0, MAX_TRACES)
      })

      lastTraceCursorRef.current = Math.max(lastTraceCursorRef.current, payload.cursor ?? 0)
    }

    const fetchBacklog = async () => {
      let cursor = lastTraceCursorRef.current
      const limit = 200

      try {
        for (let step = 0; step < 10; step += 1) {
          const response = await fetch(`/api/observability/traces/backlog?cursor=${cursor}&limit=${limit}`)
          if (!response.ok) return

          const data = (await response.json()) as {
            events?: TraceStreamPayload[]
            nextCursor?: number
            hasMore?: boolean
            latestCursor?: number
          }

          ;(data.events ?? []).forEach(event => applyTracePayload(event))

          cursor = Math.max(cursor, data.nextCursor ?? cursor)
          lastTraceCursorRef.current = Math.max(
            lastTraceCursorRef.current,
            data.latestCursor ?? cursor
          )

          if (!data.hasMore) break
        }
      } catch {
        // ignore backlog fetch failure and continue with live stream
      }
    }

    const connect = async () => {
      if (isUnmounted) return

      setStreamStatus(retryAttempt === 0 ? 'connecting' : 'reconnecting')
      await fetchBacklog()
      if (isUnmounted) return

      eventSource = new EventSource('/api/observability/traces/stream')

      eventSource.onopen = () => {
        retryAttempt = 0
        setStreamStatus('live')
      }

      eventSource.addEventListener('trace', event => {
        try {
          const payload = JSON.parse((event as MessageEvent<string>).data) as TraceStreamPayload
          applyTracePayload(payload)
        } catch {
          // ignore malformed trace event
        }
      })

      eventSource.onerror = () => {
        eventSource?.close()
        eventSource = null

        if (isUnmounted) return
        setStreamStatus('reconnecting')
        retryAttempt += 1
        const delay = Math.min(5000, 1000 * 2 ** Math.min(retryAttempt, 3))
        reconnectTimer = setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      isUnmounted = true
      setStreamStatus('offline')
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
      eventSource?.close()
    }
  }, [isLiveEnabled])

  const sourceTraces = useMemo(
    () => (liveTraces.length > 0 ? liveTraces : traces),
    [liveTraces, traces]
  )

  const serviceList = useMemo(() => {
    const apiServices = traceFilterOptionsData?.services ?? []
    if (apiServices.length > 0) return apiServices

    const set = new Set<string>()
    for (const t of sourceTraces) {
      set.add(t.service)
      for (const s of t.spans) set.add(s.service)
    }
    return Array.from(set).sort()
  }, [sourceTraces, traceFilterOptionsData])

  const operationList = useMemo(() => {
    const apiOperations = traceFilterOptionsData?.operations ?? []
    if (apiOperations.length > 0) return apiOperations

    const set = new Set<string>()
    for (const t of sourceTraces) {
      set.add(t.operation)
    }
    return Array.from(set).sort()
  }, [sourceTraces, traceFilterOptionsData])

  const environmentList = useMemo(() => {
    const apiEnvs = traceFilterOptionsData?.envs ?? []
    if (apiEnvs.length > 0) return apiEnvs

    const set = new Set<string>()
    for (const trace of sourceTraces) {
      if (typeof trace.env === 'string' && trace.env) {
        set.add(trace.env)
      }
      const traceTagEnv = trace.tags?.['resource.deployment.environment']
      if (typeof traceTagEnv === 'string' && traceTagEnv) {
        set.add(traceTagEnv)
      }
    }
    return Array.from(set).sort()
  }, [sourceTraces, traceFilterOptionsData])

  const statusList = useMemo(() => {
    const apiStatuses = traceFilterOptionsData?.statuses ?? []
    if (apiStatuses.length > 0) return apiStatuses

    const set = new Set<string>()
    for (const trace of sourceTraces) {
      if (typeof trace.status === 'string' && trace.status) {
        set.add(trace.status)
      }
    }
    return Array.from(set).sort()
  }, [sourceTraces, traceFilterOptionsData])

  const filteredTraces = useMemo(() => {
    let result = sourceTraces
    if (filterService !== 'all') {
      result = result.filter(
        t => t.service === filterService || t.spans.some(s => s.service === filterService)
      )
    }
    if (filterOperation !== 'all') {
      result = result.filter(t => t.operation === filterOperation)
    }
    if (filterStatus !== 'all') {
      result = result.filter(trace => trace.status === filterStatus)
    }
    if (filterEnvironment !== 'all') {
      result = result.filter(
        trace =>
          trace.env === filterEnvironment ||
          trace.tags?.['resource.deployment.environment'] === filterEnvironment ||
          trace.tags?.['deployment.environment'] === filterEnvironment
      )
    }
    return result
  }, [sourceTraces, filterService, filterOperation, filterStatus, filterEnvironment])

  const sortedTraces = useMemo(() => {
    const cloned = [...filteredTraces]
    // Remove duplicates by trace.id
    const uniqueTraces = new Map<string, Trace>()
    for (const trace of cloned) {
      if (!uniqueTraces.has(trace.id)) {
        uniqueTraces.set(trace.id, trace)
      }
    }
    const uniqueArray = Array.from(uniqueTraces.values())
    if (sortKey === 'duration') {
      return uniqueArray.sort((a, b) => b.duration - a.duration)
    }
    return uniqueArray.sort((a, b) => b.startTime - a.startTime)
  }, [filteredTraces, sortKey])
  const hasTraces = sortedTraces.length > 0

  const minStart = useMemo(
    () => (hasTraces ? Math.min(...sortedTraces.map(trace => trace.startTime)) : 0),
    [hasTraces, sortedTraces]
  )
  const maxStart = useMemo(
    () => (hasTraces ? Math.max(...sortedTraces.map(trace => trace.startTime)) : 0),
    [hasTraces, sortedTraces]
  )
  const minDuration = useMemo(
    () => (hasTraces ? Math.min(...sortedTraces.map(trace => trace.duration)) : 0),
    [hasTraces, sortedTraces]
  )
  const maxDuration = useMemo(
    () => (hasTraces ? Math.max(...sortedTraces.map(trace => trace.duration)) : 0),
    [hasTraces, sortedTraces]
  )

  const handleSortChange = (event: SelectChangeEvent<SortKey>) => {
    setSortKey(event.target.value as SortKey)
  }

  const getStatusColor = (statusCode?: number) => {
    if (!statusCode) return theme.palette.text.secondary
    if (statusCode >= 500) return theme.palette.error.main
    if (statusCode >= 400) return theme.palette.warning.main
    if (statusCode >= 300) return theme.palette.warning.light
    return theme.palette.success.main
  }

  const formatDurationUnit = (value: number) => `${(value / 1000).toFixed(3)}s`

  const formatTimeUnit = (value: number) => {
    const date = new Date(value)
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const timeRange = Math.max(maxStart - minStart, 1)
  const durationRange = Math.max(maxDuration - minDuration, 1)
  const hoveredTrace = hoveredTraceId
    ? (sortedTraces.find(trace => trace.id === hoveredTraceId) ?? null)
    : null

  const displayedTraces = selectedTraceId
    ? sortedTraces.filter(trace => trace.id === selectedTraceId)
    : sortedTraces

  const dependencyGraph = useMemo(() => {
    const edgeMap = new Map<string, { source: string; target: string; count: number }>()
    const services = new Set<string>()

    for (const trace of displayedTraces) {
      const spanById = new Map(trace.spans.map(span => [span.id, span]))

      for (const span of trace.spans) {
        services.add(span.service)
        if (!span.parentSpanId) continue

        const parent = spanById.get(span.parentSpanId)
        if (!parent) continue
        services.add(parent.service)

        const source = parent.service
        const target = span.service
        if (source === target) continue

        const key = `${source}->${target}`
        const existing = edgeMap.get(key)
        if (existing) {
          existing.count += 1
        } else {
          edgeMap.set(key, { source, target, count: 1 })
        }
      }
    }

    return {
      nodes: Array.from(services).sort(),
      edges: Array.from(edgeMap.values()).sort((a, b) => b.count - a.count),
    }
  }, [displayedTraces])

  const visibleTraces = useMemo(
    () => displayedTraces.slice(0, visibleCount),
    [displayedTraces, visibleCount]
  )
  const hasMoreTraces = visibleCount < displayedTraces.length

  const handleTraceListScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!hasMoreTraces) return

    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget
    if (scrollHeight - (scrollTop + clientHeight) < 140) {
      setVisibleCount(prev => Math.min(prev + PAGE_SIZE, displayedTraces.length))
    }
  }

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [sortKey, selectedTraceId])

  const handleDownloadResults = () => {
    const escapeCsv = (value: string | number | null | undefined) => {
      const text = String(value ?? '')
      const escaped = text.replace(/"/g, '""')
      return `"${escaped}"`
    }

    const header = [
      'traceId',
      'service',
      'operation',
      'status',
      'statusCode',
      'durationMs',
      'startTime',
      'spanCount',
      'errorSpanCount',
      'topServices',
    ]

    const rows = displayedTraces.map(trace => {
      const serviceCounts = trace.spans.reduce<Record<string, number>>((accumulator, span) => {
        accumulator[span.service] = (accumulator[span.service] ?? 0) + 1
        return accumulator
      }, {})

      const topServices = Object.entries(serviceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([service, count]) => `${service}(${count})`)
        .join(', ')

      const errorSpanCount = trace.spans.filter(span => span.status === 'error').length

      return [
        trace.id,
        trace.service,
        trace.operation,
        trace.status,
        trace.status_code ?? '',
        trace.duration.toFixed(2),
        new Date(trace.startTime).toISOString(),
        trace.spans.length,
        errorSpanCount,
        topServices,
      ]
    })

    const csvContent = [
      header.map(escapeCsv).join(','),
      ...rows.map(row => row.map(escapeCsv).join(',')),
    ].join('\n')

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

    anchor.href = url
    anchor.download = `traces-results-${timestamp}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  const chartData = useMemo(() => {
    const xMin = chartNow - 10 * 60 * 1000
    return sortedTraces
      .filter(trace => trace.startTime >= xMin && trace.startTime <= chartNow)
      .map(trace => {
        const normalized = (trace.duration - minDuration) / Math.max(durationRange, 1)
        const errorSpanCount = trace.spans.filter(span => span.status === 'error').length
        return {
          id: trace.id,
          service: trace.service,
          operation: trace.operation,
          startTime: trace.startTime,
          duration: trace.duration,
          size: 40 + normalized * 200,
          spanCount: trace.spans.length,
          errorSpanCount,
          statusCode: trace.status_code,
          color: getStatusColor(trace.status_code),
        }
      })
  }, [chartNow, durationRange, getStatusColor, minDuration, sortedTraces])

  const xDomain: [number, number] = [chartNow - 10 * 60 * 1000, chartNow]
  const xTicks = Array.from({ length: 11 }, (_, i) => chartNow - 10 * 60 * 1000 + i * 60 * 1000)
  const chartMaxDuration = Math.max(chartData.length > 0 ? Math.max(...chartData.map(p => p.duration)) : 0, 10000)
  const chartMinDuration = chartData.length > 0 ? Math.min(...chartData.map(p => p.duration)) : 0
  const yDomain: [number, number] = [Math.max(0, chartMinDuration * 0.9), chartMaxDuration]

  if (isTracesLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Traces</Typography>
          <Skeleton variant="rounded" width={80} height={28} />
        </Stack>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Filter panel skeleton */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Skeleton variant="text" width="15%" height={28} sx={{ mb: 1.5 }} />
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' } }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Box key={i}>
                  <Skeleton variant="text" width="50%" height={18} sx={{ mb: 0.5 }} />
                  <Skeleton variant="rounded" height={36} />
                </Box>
              ))}
            </Box>
          </Paper>
          {/* Chart skeleton */}
          <Paper variant="outlined" sx={{ p: { xs: 1.5, md: 2 }, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Skeleton variant="rounded" height={266} />
          </Paper>
          {/* Trace list skeleton */}
          <Paper variant="outlined" sx={{ borderColor: 'divider', bgcolor: 'background.paper', p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Skeleton variant="text" width={100} height={28} />
              <Stack direction="row" gap={1}>
                <Skeleton variant="rounded" width={120} height={32} />
                <Skeleton variant="rounded" width={140} height={32} />
                <Skeleton variant="rounded" width={160} height={32} />
              </Stack>
            </Box>
            <Stack gap={1.25}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Paper key={i} variant="outlined" sx={{ borderColor: 'divider', overflow: 'hidden' }}>
                  <Box sx={{ px: 1, py: 1.5, bgcolor: 'action.hover', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Skeleton variant="circular" width={20} height={20} />
                      <Skeleton variant="text" width={180} height={22} />
                      <Skeleton variant="text" width={100} height={18} />
                    </Box>
                    <Skeleton variant="text" width={60} height={22} />
                  </Box>
                  <Box sx={{ px: 1.5, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack direction="row" gap={1}>
                      <Skeleton variant="rounded" width={70} height={22} />
                      <Skeleton variant="rounded" width={70} height={22} />
                      <Skeleton variant="rounded" width={90} height={22} />
                    </Stack>
                    <Skeleton variant="text" width={120} height={18} />
                  </Box>
                </Paper>
              ))}
            </Stack>
          </Paper>
        </Box>
      </Box>
    )
  }

  if (isTracesFetched && !hasTraces) {
    return (
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Traces
        </Typography>
        <NoDataState title="No traces data" description="트레이스 데이터를 찾지 못했습니다." />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Traces
        </Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={() => setIsLiveEnabled(prev => !prev)}
          sx={{
            minWidth: 72,
            px: 1,
            py: 0.25,
            borderRadius: 999,
            borderColor: isLiveEnabled ? 'success.main' : 'divider',
            color: isLiveEnabled ? 'success.main' : 'text.secondary',
            '@keyframes neonPulse': {
              '0%, 100%': {
                opacity: 1,
                textShadow: '0 0 6px rgba(74, 222, 128, 0.75), 0 0 12px rgba(74, 222, 128, 0.45)',
              },
              '50%': { opacity: 0.42, textShadow: '0 0 1px rgba(74, 222, 128, 0.3)' },
            },
          }}
        >
          <Stack direction="row" spacing={0.6} alignItems="center">
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                bgcolor: isLiveEnabled ? 'success.main' : 'text.disabled',
                animation:
                  isLiveEnabled && streamStatus === 'live'
                    ? 'neonPulse 1.2s ease-in-out infinite'
                    : 'none',
              }}
            />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                letterSpacing: 0.5,
                color: isLiveEnabled ? 'success.main' : 'text.secondary',
                animation:
                  isLiveEnabled && streamStatus === 'live'
                    ? 'neonPulse 1.2s ease-in-out infinite'
                    : 'none',
              }}
            >
              LIVE
            </Typography>
          </Stack>
        </Button>
      </Stack>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
            Find Traces
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
            }}
          >
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Service ({serviceList.length})
              </Typography>
              <FormControl size="small" fullWidth>
                <Select value={filterService} onChange={e => setFilterService(e.target.value)}>
                  <MenuItem value="all">all</MenuItem>
                  {serviceList.map(s => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Operation ({operationList.length})
              </Typography>
              <FormControl size="small" fullWidth>
                <Select value={filterOperation} onChange={e => setFilterOperation(e.target.value)}>
                  <MenuItem value="all">all</MenuItem>
                  {operationList.map(op => (
                    <MenuItem key={op} value={op}>{op}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Status ({statusList.length})
              </Typography>
              <FormControl size="small" fullWidth>
                <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <MenuItem value="all">all</MenuItem>
                  {statusList.map(status => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Environment ({environmentList.length})
              </Typography>
              <FormControl size="small" fullWidth>
                <Select value={filterEnvironment} onChange={e => setFilterEnvironment(e.target.value)}>
                  <MenuItem value="all">all</MenuItem>
                  {environmentList.map(env => (
                    <MenuItem key={env} value={env}>{env}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Paper>

        {/* Right Content */}
        <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>

      <Paper
        variant="outlined"
        sx={{
          p: { xs: 1.5, md: 2 },
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Card variant="outlined" sx={{ borderColor: 'divider', bgcolor: 'background.default' }}>
          <CardContent sx={{ p: { xs: 1, md: 1.5 }, height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 10, right: 18, bottom: 16, left: 8 }}
                onMouseLeave={() => setHoveredTraceId(null)}
              >
                <CartesianGrid stroke={theme.palette.divider} strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="startTime"
                  name="Time"
                  domain={xDomain}
                  ticks={xTicks}
                  tickFormatter={(value: number) => formatTimeUnit(value)}
                  tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: theme.palette.divider }}
                  minTickGap={24}
                />
                <YAxis
                  type="number"
                  dataKey="duration"
                  name="Duration"
                  domain={yDomain}
                  tickFormatter={(value: number) => formatDurationUnit(value)}
                  tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: theme.palette.divider }}
                  width={52}
                />
                <ZAxis type="number" dataKey="size" range={[30, 260]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                  }}
                  content={props => {
                    const payload = props?.payload as
                      | Array<{
                          payload?: {
                            service?: string
                            operation?: string
                            startTime?: number
                            duration?: number
                            statusCode?: number
                            spanCount?: number
                            errorSpanCount?: number
                            id?: string
                          }
                        }>
                      | undefined

                    const item = payload?.[0]?.payload
                    if (!props?.active || !item) {
                      return null
                    }

                    return (
                      <Box
                        sx={{
                          bgcolor: 'background.paper',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          p: 1,
                          minWidth: 210,
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                          {item.service}: {item.operation}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mb: 0.5 }}
                        >
                          {new Date(item.startTime ?? 0).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                          <br />{item.id}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          Duration: {formatDurationUnit(item.duration ?? 0)}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          Status: {item.statusCode ?? '-'}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          Spans: {item.spanCount ?? 0}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          Error Spans: {item.errorSpanCount ?? 0}
                        </Typography>
                      </Box>
                    )
                  }}
                />
                <Scatter
                  data={chartData}
                  isAnimationActive={false}
                  onMouseEnter={(point: { id?: string }) => setHoveredTraceId(point?.id ?? null)}
                  onClick={(point: { id?: string }) => {
                    const pointId = point?.id
                    if (!pointId) return
                    setSelectedTraceId(prev => (prev === pointId ? null : pointId))
                  }}
                >
                  {chartData.map(point => {
                    const isSelected = selectedTraceId === point.id
                    const isHovered = hoveredTraceId === point.id
                    const isDimmed = selectedTraceId !== null && !isSelected
                    return (
                      <Cell
                        key={`trace-cell-${point.id}`}
                        fill={point.color}
                        fillOpacity={isDimmed ? 0.28 : isHovered || isSelected ? 1 : 0.84}
                        stroke={isSelected ? theme.palette.common.white : point.color}
                        strokeWidth={isSelected ? 2 : 1}
                        style={{ cursor: 'pointer' }}
                      />
                    )
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Paper>

      <Paper variant="outlined" sx={{ borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          gap={1.5}
          sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {displayedTraces.length} Traces
          </Typography>
          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
            {selectedTraceId && (
              <Button variant="text" size="small" onClick={() => setSelectedTraceId(null)}>
                Clear Dot Filter
              </Button>
            )}
            <Typography variant="body2" color="text.secondary">
              Sort:
            </Typography>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select value={sortKey} onChange={handleSortChange}>
                <MenuItem value="recent">Most Recent</MenuItem>
                <MenuItem value="duration">Longest Duration</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" size="small" onClick={handleDownloadResults}>
              Download Results
            </Button>
            <Button variant="outlined" size="small" onClick={() => setShowDependencyGraph(true)}>
              Deep Dependency Graph
            </Button>
          </Stack>
        </Stack>

        <Box
          sx={{ p: 2, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Compare traces by selecting result items
          </Typography>
        </Box>

        <Box sx={{ p: 1.5, maxHeight: 520, overflowY: 'auto' }} onScroll={handleTraceListScroll}>
          <Stack gap={1.5}>
            {visibleTraces.map(trace => {
              const serviceCounts = trace.spans.reduce<Record<string, number>>(
                (accumulator, span) => {
                  accumulator[span.service] = (accumulator[span.service] ?? 0) + 1
                  return accumulator
                },
                {}
              )

              const errorCount = trace.spans.filter(span => span.status === 'error').length
              const topServices = Object.entries(serviceCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)

              return (
                <Paper
                  key={trace.id}
                  component={Link}
                  href={`/traces/${trace.id}`}
                  variant="outlined"
                  sx={{
                    textDecoration: 'none',
                    color: 'inherit',
                    borderColor: selectedTraceId === trace.id ? 'primary.main' : 'divider',
                    overflow: 'hidden',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ px: 1, py: 1.5, bgcolor: 'action.hover' }}
                  >
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Checkbox size="small" sx={{ p: 0.5 }} />
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {trace.service}: {trace.operation}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {trace.id}
                      </Typography>
                    </Stack>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {(trace.duration / 1000).toFixed(3)}s
                    </Typography>
                  </Stack>

                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', md: 'center' }}
                    gap={1}
                    sx={{ px: 1.5, py: 1.5 }}
                  >
                    <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
                      <Chip size="small" label={`${trace.spans.length} Spans`} variant="outlined" />
                      <Chip
                        size="small"
                        label={`${errorCount} Errors`}
                        color={errorCount > 0 ? 'error' : 'success'}
                        variant={errorCount > 0 ? 'filled' : 'outlined'}
                      />
                      {topServices.map(([service, count]) => (
                        <Chip
                          key={`${trace.id}-${service}`}
                          size="small"
                          label={`${service} (${count})`}
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {formatTimestamp(trace.startTime)}
                    </Typography>
                  </Stack>
                </Paper>
              )
            })}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.25, display: 'block' }}>
            Showing {visibleTraces.length} of {displayedTraces.length} traces
            {hasMoreTraces ? ' · Scroll down to load more' : ''}
          </Typography>
        </Box>
      </Paper>

      <Dialog
        open={showDependencyGraph}
        onClose={() => setShowDependencyGraph(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Deep Dependency Graph</DialogTitle>
        <DialogContent>
          <Stack gap={1.5} sx={{ pt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Nodes: {dependencyGraph.nodes.length} · Edges: {dependencyGraph.edges.length}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                gap: 1,
                flexWrap: 'wrap',
                p: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              {dependencyGraph.nodes.map(node => (
                <Chip key={node} label={node} size="small" variant="outlined" />
              ))}
            </Box>

            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 120px',
                  px: 1.5,
                  py: 1,
                  bgcolor: 'action.hover',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  Source
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  Target
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  Calls
                </Typography>
              </Box>

              <Box sx={{ maxHeight: 280, overflowY: 'auto' }}>
                {dependencyGraph.edges.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
                    No cross-service dependencies found in current result set.
                  </Typography>
                ) : (
                  dependencyGraph.edges.map(edge => (
                    <Box
                      key={`${edge.source}-${edge.target}`}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 120px',
                        px: 1.5,
                        py: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography variant="body2">{edge.source}</Typography>
                      <Typography variant="body2">{edge.target}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {edge.count}
                      </Typography>
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
        </Box>
      </Box>
    </Box>
  )
}
