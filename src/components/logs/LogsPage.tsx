'use client'

import { UIEvent, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  Box,
  Skeleton,
  Paper,
  Stack,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Button,
} from '@mui/material'
import { apiClient } from '@/lib/apiClient'
import { LogEntry } from '@/lib/types'
import LogsTable from '@/components/logs/LogsTable'
import LogFilters from '@/components/logs/LogFilters'
import LiveButton from '@/components/logs/LogFilters/LiveButton'
import NoDataState from '@/components/common/NoDataState'
import { LogsHistogram, type HistogramDataItem } from '@/components/logs/LogsHistogram'
import { FieldExplorer } from '@/components/logs/FieldExplorer'
import { LogDetailDrawer } from '@/components/logs/LogDetailDrawer'

type LogStreamPayload = {
  cursor: number
  ts: number
  log: LogEntry
}

type LogSource = 'all' | 'app' | 'host'

type InternalHistogramBucket = {
  key: number
  label: Date
  count: number
  debug: number
  info: number
  warn: number
  error: number
  unknown: number
  interval: number
  bucketStart: Date
  bucketEnd: Date
}

const EMPTY_LOGS: LogEntry[] = []

const formatAxisDateTime = (value: Date | number | string, withSeconds = false) => {
  const date = value instanceof Date ? value : new Date(value)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  if (!withSeconds) {
    return `${month}-${dd} ${hh}:${minute}`
  }

  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${month}-${dd} ${hh}:${minute}:${ss}`
}

const formatFullDateTime = (value: Date | number | string) => {
  const date = value instanceof Date ? value : new Date(value)
  const yyyy = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${yyyy}-${month}-${day} ${hh}:${mm}:${ss}`
}

export default function LogsPage() {
  const PAGE_SIZE = 60
  const [liveLogs, setLiveLogs] = useState<LogEntry[]>([])
  const [isLiveEnabled, setIsLiveEnabled] = useState(true)
  const [isLiveStreaming, setIsLiveStreaming] = useState(false)
  const lastLogCursorRef = useRef(0)
  const [query, setQuery] = useState('')
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const [timeRange] = useState<'all'>('all')
  const [logSource, setLogSource] = useState<LogSource>('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [fieldSearch, setFieldSearch] = useState('')
  const [selectedBucketKey, setSelectedBucketKey] = useState<number | null>(null)

  // 필터 옵션 목록 수신
  const { data: filterOptions, isLoading: isFilterOptionsLoading } = useQuery({
    queryKey: ['logFilterOptions'],
    queryFn: async () => {
      // OpenAPI 엔드포인트에 맞게 직접 fetch 사용
      const response = await fetch('/api/observability/logs/filters')
      if (!response.ok) return {}
      const data = await response.json()
      return data
    },
  })
  const [customFilters, setCustomFilters] = useState<string[]>([])

  const updateSectionFilters = (prefix: string, values: string[]) => {
    const normalizedPrefix = `${prefix.toLowerCase()}:`

    setCustomFilters(prev => {
      const remaining = prev.filter(filter => !filter.toLowerCase().startsWith(normalizedPrefix))

      if (values.length === 0) {
        return remaining
      }

      const nextValues = values.map(value => `${prefix}:${value}`)
      return Array.from(new Set([...remaining, ...nextValues]))
    })
  }

  const getSectionFilters = (prefix: string) => {
    const normalizedPrefix = `${prefix.toLowerCase()}:`
    return customFilters
      .filter(filter => filter.toLowerCase().startsWith(normalizedPrefix))
      .map(filter => filter.slice(filter.indexOf(':') + 1))
  }

  const selectedServices = useMemo(() => getSectionFilters('service'), [customFilters])
  const selectedEnvs = useMemo(() => getSectionFilters('env'), [customFilters])
  const selectedLevels = useMemo(() => getSectionFilters('level'), [customFilters])
  const selectedHosts = useMemo(() => getSectionFilters('host'), [customFilters])
  const selectedIndexes = useMemo(() => getSectionFilters('index'), [customFilters])

  const {
    data: queryLogsData,
    refetch,
    isLoading: isLogsLoading,
    isFetched: isLogsFetched,
  } = useQuery({
    queryKey: ['logs'],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '1000' })
      const res = await fetch(`/api/observability/logs?${params.toString()}`)
      if (!res.ok) return []
      const data = (await res.json()) as { logs?: LogEntry[] }
      return Array.isArray(data.logs) ? data.logs : []
    },
  })
  const queryLogs = queryLogsData ?? EMPTY_LOGS

  // Live logs stream
  useEffect(() => {
    const MAX_LOGS = 1000
    let isUnmounted = false
    let eventSource: EventSource | null = null
    let reconnectTimer: NodeJS.Timeout | null = null
    let retryAttempt = 0

    const applyLogPayload = (payload: LogStreamPayload) => {
      if (isUnmounted) return
      setLiveLogs(prev => {
        const deduped = prev.filter(log => log.id !== payload.log.id)
        return [payload.log, ...deduped].slice(0, MAX_LOGS)
      })

      lastLogCursorRef.current = Math.max(lastLogCursorRef.current, payload.cursor ?? 0)
    }

    const fetchBacklog = async () => {
      let cursor = lastLogCursorRef.current
      const limit = 500

      try {
        for (let step = 0; step < 20; step += 1) {
          const response = await fetch(`/api/observability/logs/backlog?cursor=${cursor}&limit=${limit}`)
          if (!response.ok) return

          const data = (await response.json()) as {
            events?: LogStreamPayload[]
            nextCursor?: number
            hasMore?: boolean
            latestCursor?: number
          }

          ;(data.events ?? []).forEach(event => applyLogPayload(event))

          cursor = Math.max(cursor, data.nextCursor ?? cursor)
          lastLogCursorRef.current = Math.max(lastLogCursorRef.current, data.latestCursor ?? cursor)

          if (!data.hasMore) break
        }
      } catch {
        // ignore backlog fetch failure and continue with live stream
      }
    }

    const connect = async () => {
      if (isUnmounted) return

      // setStreamStatus(retryAttempt === 0 ? 'connecting' : 'reconnecting');
      await fetchBacklog()
      if (isUnmounted) return

      eventSource = new EventSource('/api/observability/logs/stream')

      eventSource.onopen = () => {
        retryAttempt = 0
        setIsLiveStreaming(true)
      }

      eventSource.addEventListener('log', event => {
        try {
          const payload = JSON.parse((event as MessageEvent<string>).data) as LogStreamPayload
          applyLogPayload(payload)
        } catch {
          // ignore malformed stream event
        }
      })

      eventSource.onerror = () => {
        eventSource?.close()
        eventSource = null

        if (isUnmounted) return
        setIsLiveStreaming(false)
        retryAttempt += 1
        const delay = Math.min(5000, 1000 * 2 ** Math.min(retryAttempt, 3))
        reconnectTimer = setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      isUnmounted = true
      setIsLiveStreaming(false)
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
      eventSource?.close()
    }
  }, [isLiveEnabled])

  // live 로그가 있으면 우선, 없으면 query 로그 사용
  const logs = useMemo(() => {
    return liveLogs.length > 0 ? liveLogs : queryLogs
  }, [liveLogs, queryLogs])

  const getFieldValue = (log: LogEntry, field: string) => {
    const normalizedField = field.toLowerCase()
    const metadata = log.metadata ?? {}
    const tags = log.tags ?? {}

    if (normalizedField === 'index' || normalizedField === 'source' || normalizedField === 'log_source') {
      return log.source
    }
    if (normalizedField === 'service') return log.service
    if (normalizedField === 'message') return log.message
    if (normalizedField === 'level') return log.level
    if (normalizedField === 'env') return log.env
    if (normalizedField === 'host') {
      return metadata.host ?? metadata.hostname ?? tags.host
    }
    if (normalizedField === 'traceid') return metadata.traceId
    if (normalizedField === 'requestid') return metadata.requestId
    if (normalizedField.startsWith('tag.')) return tags[normalizedField.replace('tag.', '')]

    const metadataEntry = Object.entries(metadata).find(
      ([key]) => key.toLowerCase() === normalizedField
    )
    if (metadataEntry) return metadataEntry[1]

    return undefined
  }

  const normalizeFilterField = (field: string) => {
    const normalized = field.trim().toLowerCase()

    if (normalized === 'environment') return 'env'
    if (normalized === 'source' || normalized === 'log_source') return 'index'

    return normalized
  }

  const isStructuredFilterKey = (field: string) => {
    const normalized = normalizeFilterField(field)

    return (
      normalized === 'service' ||
      normalized === 'message' ||
      normalized === 'level' ||
      normalized === 'env' ||
      normalized === 'index' ||
      normalized === 'host' ||
      normalized === 'traceid' ||
      normalized === 'requestid' ||
      normalized.startsWith('tag.')
    )
  }

  const luceneMatch = (log: LogEntry, rawQuery: string) => {
    const tokens = rawQuery.match(/(?:[^\s"]+|"[^"]*")+/g) ?? []
    if (tokens.length === 0) return true

    return tokens.every(token => {
      const cleanedToken = token.replace(/^"|"$/g, '')
      const separatorIndex = cleanedToken.indexOf(':')

      if (separatorIndex > 0) {
        const field = cleanedToken.slice(0, separatorIndex)
        const expectedRaw = cleanedToken.slice(separatorIndex + 1)
        const expected = expectedRaw.replace(/^"|"$/g, '').toLowerCase()
        const actual = String(getFieldValue(log, field) ?? '').toLowerCase()
        return actual.includes(expected)
      }

      const searchable =
        `${log.service} ${log.env} ${log.level} ${log.message} ${JSON.stringify(log.metadata ?? {})}`.toLowerCase()
      return searchable.includes(cleanedToken.toLowerCase())
    })
  }

  const groupedCustomFilters = useMemo(() => {
    const grouped = new Map<string, string[]>()
    const freeText: string[] = []

    for (const filter of customFilters) {
      const trimmed = filter.trim()
      if (!trimmed) continue

      const idx = trimmed.indexOf(':')
      if (idx <= 0) {
        freeText.push(trimmed)
        continue
      }

      const rawField = trimmed.slice(0, idx)
      if (!isStructuredFilterKey(rawField)) {
        freeText.push(trimmed)
        continue
      }

      const field = normalizeFilterField(rawField)
      const value = trimmed.slice(idx + 1).trim().replace(/^"|"$/g, '')
      if (!value) continue

      const existing = grouped.get(field) ?? []
      grouped.set(field, [...existing, value])
    }

    return { grouped, freeText }
  }, [customFilters])

  const matchesLogFilters = (log: LogEntry) => {
    const queryText = query.trim()
    if (queryText && !luceneMatch(log, queryText)) {
      return false
    }

    // free text filters are combined with AND semantics.
    if (!groupedCustomFilters.freeText.every(expression => luceneMatch(log, expression))) {
      return false
    }

    // Same-field filters use OR semantics; different fields remain AND.
    for (const [field, values] of groupedCustomFilters.grouped.entries()) {
      const actual = String(getFieldValue(log, field) ?? '').toLowerCase()
      const matched = values.some(value => actual.includes(value.toLowerCase()))
      if (!matched) {
        return false
      }
    }

    return true
  }

  const baseFiltered = useMemo(() => {
    const sortedByTime = [...logs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    if (sortedByTime.length === 0) return []

    return sortedByTime.filter(matchesLogFilters)
  }, [logs, query, customFilters])

  // 버킷 캐시: key → bucket (한번 집계된 버킷은 카운트를 줄이지 않음)
  const bucketCacheRef = useRef<Map<number, InternalHistogramBucket>>(new Map())
  const processedLogIdsRef = useRef<Set<string>>(new Set())
  const lastTimeRangeRef = useRef<typeof timeRange>(timeRange)
  const lastIntervalRef = useRef<number>(0)

  const histogram = useMemo((): InternalHistogramBucket[] => {
    if (baseFiltered.length === 0) {
      bucketCacheRef.current.clear()
      processedLogIdsRef.current.clear()
      return []
    }

    const nowTs = Date.now()
    const rangeMsMap: Record<typeof timeRange, number> = {
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      all: Number.MAX_SAFE_INTEGER,
    }
    const intervalByRange: Record<typeof timeRange, number> = {
      '15m': 60 * 1000,
      '1h': 5 * 60 * 1000,
      '6h': 15 * 60 * 1000,
      '24h': 60 * 60 * 1000,
      all: 0,
    }

    const timestamps = baseFiltered.map(item => new Date(item.timestamp).getTime())
    const latestTs = Math.max(...timestamps)
    const earliestTs = Math.min(...timestamps)
    const durationMs = timeRange === 'all' ? latestTs - earliestTs : rangeMsMap[timeRange]

    let interval: number
    if (timeRange === 'all') {
      const rawInterval = Math.max(Math.ceil(durationMs / 30), 1000)
      const niceSteps = [1000, 5000, 10000, 30000, 60000, 5 * 60000, 10 * 60000, 30 * 60000, 60 * 60000, 2 * 60 * 60000, 6 * 60 * 60000, 12 * 60 * 60000, 24 * 60 * 60000]
      interval = niceSteps.find(step => step >= rawInterval) ?? rawInterval
    } else {
      interval = intervalByRange[timeRange]
    }

    // timeRange나 interval이 바뀌면 캐시 초기화
    if (lastTimeRangeRef.current !== timeRange || lastIntervalRef.current !== interval) {
      bucketCacheRef.current.clear()
      processedLogIdsRef.current.clear()
      lastTimeRangeRef.current = timeRange
      lastIntervalRef.current = interval
    }

    const cache = bucketCacheRef.current
    const processed = processedLogIdsRef.current

    // 새로 추가된 로그만 증분 집계
    for (const item of baseFiltered) {
      if (processed.has(item.id)) continue
      processed.add(item.id)

      const ts = new Date(item.timestamp).getTime()
      const bucketKey = Math.floor(ts / interval) * interval

      if (!cache.has(bucketKey)) {
        cache.set(bucketKey, {
          key: bucketKey,
          label: new Date(bucketKey),
          count: 0, debug: 0, info: 0, warn: 0, error: 0, unknown: 0,
          interval,
          bucketStart: new Date(bucketKey),
          bucketEnd: new Date(bucketKey + interval),
        })
      }

      const bucket = cache.get(bucketKey)!
      bucket.count += 1
      if (item.level === 'ERROR') bucket.error += 1
      else if (item.level === 'WARN') bucket.warn += 1
      else if (item.level === 'DEBUG') bucket.debug += 1
      else if (item.level === 'INFO') bucket.info += 1
      else bucket.unknown += 1
    }

    // 화면에 표시할 시간 범위 계산
    const bucketCount = timeRange === 'all' ? 30 : Math.min(Math.ceil(durationMs / interval), 60)
    const alignedLatest = Math.ceil(latestTs / interval) * interval
    const windowStart = timeRange === 'all'
      ? Math.floor(earliestTs / interval) * interval
      : alignedLatest - bucketCount * interval
    const windowEnd = alignedLatest

    // 윈도우 안에 있는 버킷만 반환 (밖으로 나간 버킷은 자연스럽게 제외)
    const totalBuckets = timeRange === 'all'
      ? Math.max(1, Math.ceil((windowEnd - windowStart) / interval))
      : bucketCount

    return Array.from({ length: totalBuckets }, (_, idx) => {
      const bucketStartTs = windowStart + idx * interval
      return cache.get(bucketStartTs) ?? {
        key: bucketStartTs,
        label: new Date(bucketStartTs),
        count: 0, debug: 0, info: 0, warn: 0, error: 0, unknown: 0,
        interval,
        bucketStart: new Date(bucketStartTs),
        bucketEnd: new Date(bucketStartTs + interval),
      }
    })
  }, [baseFiltered, timeRange])

  const filtered = useMemo(() => {
    if (selectedBucketKey === null || histogram.length === 0) {
      return baseFiltered
    }

    const bucket = histogram.find(item => item.key === selectedBucketKey)
    if (!bucket) {
      return baseFiltered
    }

    const bucketStartTs = bucket.bucketStart.getTime()
    const bucketEndTs = bucket.bucketEnd.getTime()

    return baseFiltered.filter(log => {
      const ts = new Date(log.timestamp).getTime()
      return ts >= bucketStartTs && ts < bucketEndTs
    })
  }, [baseFiltered, histogram, selectedBucketKey])

  const visibleLogs = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount])
  const hasMoreLogs = visibleCount < filtered.length

  const handleTableScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!hasMoreLogs) return

    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget
    if (scrollHeight - (scrollTop + clientHeight) < 120) {
      setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filtered.length))
    }
  }

  const maxBucket = Math.max(...histogram.map(bucket => bucket.count), 1)

  const histogramData: HistogramDataItem[] = useMemo(
    () =>
      histogram.map(bucket => ({
        ...bucket,
        tsLabel: formatAxisDateTime(bucket.label, bucket.interval < 60 * 1000),
        tsFullLabel: formatFullDateTime(bucket.label),
      })),
    [histogram]
  )

  const fieldCandidates = useMemo(() => {
    const baseFields = ['@timestamp', 'service', 'level', 'message', 'env', 'traceId', 'requestId']
    const dynamicFields = new Set<string>()

    for (const item of logs) {
      Object.keys(item.metadata ?? {}).forEach(field => dynamicFields.add(field))
      Object.keys(item.tags ?? {}).forEach(field => dynamicFields.add(`tag.${field}`))
    }

    const merged = [...baseFields, ...Array.from(dynamicFields)]
    const uniqueOrdered = Array.from(new Set(merged))

    return uniqueOrdered.slice(0, 20)
  }, [logs])

  const filteredFields = useMemo(() => {
    if (!fieldSearch.trim()) return fieldCandidates
    return fieldCandidates.filter(field => field.toLowerCase().includes(fieldSearch.toLowerCase()))
  }, [fieldCandidates, fieldSearch])

  const exceptionCount = filtered.filter(item => item.level === 'ERROR').length

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [query, selectedBucketKey])

  if (isLogsLoading && !queryLogsData) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Logs</Typography>
          <Skeleton variant="rounded" width={80} height={32} />
        </Box>
        <Paper variant="outlined" sx={{ borderColor: 'divider', bgcolor: 'background.paper', overflow: 'hidden' }}>
          {/* Search bar */}
          <Box sx={{ p: 1.5 }}>
            <Skeleton variant="rounded" height={44} />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '300px minmax(0, 1fr)' }, minHeight: 520 }}>
            {/* Field Explorer skeleton */}
            <Box sx={{ borderRight: '1px solid', borderColor: 'divider', p: 1.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Skeleton variant="rounded" height={40} />
              <Skeleton variant="rounded" height={40} />
              {Array.from({ length: 4 }).map((_, i) => (
                <Box key={i} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Skeleton variant="rounded" height={28} />
                  <Skeleton variant="rounded" height={28} sx={{ opacity: 0.6 }} />
                </Box>
              ))}
            </Box>
            {/* Main content skeleton */}
            <Box sx={{ p: 1.5, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Skeleton variant="text" width={120} height={36} sx={{ mx: 'auto' }} />
              {/* Histogram */}
              <Skeleton variant="rounded" height={140} />
              {/* Table rows */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Skeleton variant="rounded" height={44} />
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} variant="rounded" height={44} sx={{ opacity: 1 - i * 0.1 }} />
                ))}
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    )
  }

  if (isLogsFetched && logs?.length === 0) {
    return (
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Logs
        </Typography>
        <NoDataState title="No logs data" description="로그 데이터를 찾지 못했습니다." />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'space-between' }}
      >
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Logs
        </Typography>
        <LiveButton
          value={isLiveEnabled}
          onChange={setIsLiveEnabled}
          isStreaming={isLiveStreaming}
        />
      </Box>

      <Paper
        variant="outlined"
        sx={{
          borderColor: 'divider',
          bgcolor: 'background.paper',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 1.5 }}>
          <LogFilters
            query={query}
            onQueryChange={setQuery}
            onRefresh={refetch}
            customFilters={customFilters}
            onCustomFiltersChange={setCustomFilters}
          />
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '300px minmax(0, 1fr)' },
            minHeight: 520,
          }}
        >
          <FieldExplorer
            onSectionChange={updateSectionFilters}
            filterOptions={filterOptions}
            selectedIndexes={selectedIndexes}
            selectedServices={selectedServices}
            selectedEnvs={selectedEnvs}
            selectedLevels={selectedLevels}
            selectedHosts={selectedHosts}
          />

          <Box sx={{ p: 1.5, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>
                  {filtered.length.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>hits</Typography>
              </Box>
              {selectedBucketKey !== null && (
                <Button size="small" variant="outlined" onClick={() => setSelectedBucketKey(null)} sx={{ fontSize: 11, py: 0.25, px: 1 }}>
                  Clear time filter
                </Button>
              )}
            </Box>

            {filtered.length === 0 ? (
              <NoDataState
                title="No matching logs"
                description="조건에 맞는 로그를 찾지 못했습니다."
              />
            ) : (
              <>
                {/* 동적 차트 렌더링 */}
                <LogsHistogram
                  histogramData={histogramData}
                  maxBucket={maxBucket}
                  selectedBucketKey={selectedBucketKey}
                  onSelectBucket={setSelectedBucketKey}
                />
                <Box
                  onScroll={handleTableScroll}
                  sx={{
                    minWidth: 0,
                    maxHeight: 420,
                    overflowY: 'auto',
                  }}
                >
                  <LogsTable logs={visibleLogs} onSelect={setSelectedLog} query={query} compact />
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: 'block' }}
                >
                  Showing {visibleLogs.length.toLocaleString()} of{' '}
                  {filtered.length.toLocaleString()} logs
                  {hasMoreLogs ? ' · Scroll down to load more' : ''}
                </Typography>
              </>
            )}
          </Box>
        </Box>
      </Paper>

      <LogDetailDrawer selectedLog={selectedLog} onClose={() => setSelectedLog(null)} />
    </Box>
  )
}
