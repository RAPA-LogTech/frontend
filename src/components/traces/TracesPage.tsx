'use client'

import { UIEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { apiClient } from '@/lib/apiClient'
import type { Trace } from '@/lib/types'
import NoDataState from '@/components/common/NoDataState'
import TracesKpiRow from './TracesKpiRow'
import TracesFilterBar from './TracesFilterBar'
import TracesScatterChart from './TracesScatterChart'
import TracesTable from './TracesTable'

type SortKey = 'recent' | 'duration'

type TraceStreamPayload = {
  cursor: number
  ts: number
  trace: Trace
}

const EMPTY_TRACES: Trace[] = []

export default function TracesPage() {
  const PAGE_SIZE = 30
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
          const response = await fetch(
            `/api/observability/traces/backlog?cursor=${cursor}&limit=${limit}`
          )
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

  const sourceTraces: Trace[] = useMemo(
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
  const hasSourceTraces = sourceTraces.length > 0

  const handleSortChange = (event: SelectChangeEvent<SortKey>) => {
    setSortKey(event.target.value as SortKey)
  }

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

  if (isTracesLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Traces
          </Typography>
          <Skeleton variant="rounded" width={80} height={28} />
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} variant="rounded" height={100} sx={{ flex: 1 }} />
          ))}
        </Box>
        <Skeleton variant="rounded" height={56} />
        <Skeleton variant="rounded" height={280} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Skeleton variant="rounded" height={40} />
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} variant="rounded" height={40} sx={{ opacity: 1 - i * 0.1 }} />
          ))}
        </Box>
      </Box>
    )
  }

  if (isTracesFetched && !hasSourceTraces) {
    return (
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Traces
        </Typography>
        <NoDataState title="No traces data" description="트레이스 데이터를 찾지 못했습니다." />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Traces
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
            Distributed trace explorer · real-time
          </Typography>
        </Box>
      </Box>

      {/* KPI */}
      <TracesKpiRow traces={sortedTraces} />

      {/* 필터 */}
      <TracesFilterBar
        traces={sortedTraces}
        filterService={filterService}
        filterOperation={filterOperation}
        filterStatus={filterStatus}
        filterEnvironment={filterEnvironment}
        serviceList={serviceList}
        operationList={operationList}
        statusList={statusList}
        environmentList={environmentList}
        onFilterService={setFilterService}
        onFilterOperation={setFilterOperation}
        onFilterStatus={setFilterStatus}
        onFilterEnvironment={setFilterEnvironment}
      />

      {/* 산점도 차트 */}
      <TracesScatterChart
        traces={sortedTraces}
        isLiveEnabled={isLiveEnabled}
        streamStatus={streamStatus}
        onLiveChange={setIsLiveEnabled}
        onSelectTrace={setSelectedTraceId}
        selectedTraceId={selectedTraceId}
      />

      {/* 트레이스 목록 */}
      <Paper variant="outlined" sx={{ borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box
          sx={{
            px: 2,
            py: 1.25,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>
              {displayedTraces.length.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              traces
            </Typography>
            {selectedTraceId && (
              <Chip
                label="filtered by dot"
                size="small"
                onDelete={() => setSelectedTraceId(null)}
                sx={{
                  height: 20,
                  fontSize: 10,
                  ml: 1,
                  bgcolor: 'rgba(99,102,241,0.1)',
                  color: '#818cf8',
                  border: '1px solid rgba(99,102,241,0.3)',
                }}
              />
            )}
          </Box>
          <Stack direction="row" alignItems="center" gap={1}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Sort:
            </Typography>
            <Select
              value={sortKey}
              onChange={handleSortChange}
              size="small"
              sx={{ fontSize: 12, minWidth: 150 }}
            >
              <MenuItem value="recent" sx={{ fontSize: 12 }}>
                Most Recent
              </MenuItem>
              <MenuItem value="duration" sx={{ fontSize: 12 }}>
                Longest Duration
              </MenuItem>
            </Select>
            <Button
              variant="outlined"
              size="small"
              onClick={handleDownloadResults}
              sx={{ fontSize: 11, whiteSpace: 'nowrap' }}
            >
              Export CSV
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowDependencyGraph(true)}
              sx={{ fontSize: 11, whiteSpace: 'nowrap' }}
            >
              Dependency Graph
            </Button>
          </Stack>
        </Box>

        <Box onScroll={handleTraceListScroll} sx={{ maxHeight: 520, overflowY: 'auto' }}>
          <TracesTable traces={visibleTraces} selectedTraceId={selectedTraceId} />
        </Box>

        <Box sx={{ px: 2, py: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Showing {visibleTraces.length.toLocaleString()} of{' '}
            {displayedTraces.length.toLocaleString()} traces
            {hasMoreTraces ? ' · Scroll down to load more' : ''}
          </Typography>
        </Box>
      </Paper>

      {/* Dependency Graph Dialog */}
      <Dialog
        open={showDependencyGraph}
        onClose={() => setShowDependencyGraph(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Dependency Graph
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', display: 'block', fontWeight: 400 }}
          >
            {dependencyGraph.nodes.length} nodes · {dependencyGraph.edges.length} edges
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack gap={1.5} sx={{ pt: 0.5 }}>
            <Box
              sx={{
                display: 'flex',
                gap: 0.75,
                flexWrap: 'wrap',
                p: 1.25,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              {dependencyGraph.nodes.map(node => (
                <Chip
                  key={node}
                  label={node}
                  size="small"
                  variant="outlined"
                  sx={{ fontFamily: 'monospace', fontSize: 11 }}
                />
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
                  gridTemplateColumns: '1fr 1fr 100px',
                  px: 1.5,
                  py: 1,
                  bgcolor: 'action.hover',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                {['Source', 'Target', 'Calls'].map(h => (
                  <Typography
                    key={h}
                    variant="caption"
                    sx={{ fontWeight: 700, fontSize: 10, letterSpacing: 0.5 }}
                  >
                    {h.toUpperCase()}
                  </Typography>
                ))}
              </Box>
              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                {dependencyGraph.edges.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', p: 1.5 }}>
                    No cross-service dependencies found.
                  </Typography>
                ) : (
                  dependencyGraph.edges.map(edge => (
                    <Box
                      key={`${edge.source}->${edge.target}`}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 100px',
                        px: 1.5,
                        py: 0.875,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                        {edge.source}
                      </Typography>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                        {edge.target}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 800, color: '#60a5fa', fontFamily: 'monospace' }}
                      >
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
  )
}
