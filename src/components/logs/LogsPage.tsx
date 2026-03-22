'use client'

import { UIEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
import NoDataState from '@/components/common/NoDataState'
import { LogsHistogram, type HistogramDataItem } from '@/components/logs/LogsHistogram'
import { FieldExplorer } from '@/components/logs/FieldExplorer'
import { LogDetailDrawer } from '@/components/logs/LogDetailDrawer'

type LogStreamPayload = {
  cursor: number
  ts: number
  log: LogEntry
}

type InternalHistogramBucket = {
  key: number
  label: Date
  count: number
  debug: number
  info: number
  warn: number
  error: number
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
  const [activeTab, setActiveTab] = useState<'logs' | 'patterns' | 'exceptions'>('logs')
  const [isLuceneMode, setIsLuceneMode] = useState(true)
  const [timeRange, setTimeRange] = useState<'15m' | '1h' | '6h' | '24h' | 'all'>('15m')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [fieldSearch, setFieldSearch] = useState('')
  const [selectedBucketKey, setSelectedBucketKey] = useState<number | null>(null)

  const {
    data: queryLogsData,
    refetch,
    isLoading: isLogsLoading,
    isFetched: isLogsFetched,
  } = useQuery({
    queryKey: ['logs', timeRange],
    queryFn: () => apiClient.getLogsLegacy(timeRange),
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
          const response = await fetch(`/api/logs/backlog?cursor=${cursor}&limit=${limit}`)
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

      eventSource = new EventSource('/api/logs/stream')

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

    if (normalizedField === 'service') return log.service
    if (normalizedField === 'message') return log.message
    if (normalizedField === 'level') return log.level
    if (normalizedField === 'env') return log.env
    if (normalizedField === 'traceid') return metadata.traceId
    if (normalizedField === 'requestid') return metadata.requestId
    if (normalizedField.startsWith('tag.')) return tags[normalizedField.replace('tag.', '')]

    const metadataEntry = Object.entries(metadata).find(
      ([key]) => key.toLowerCase() === normalizedField
    )
    if (metadataEntry) return metadataEntry[1]

    return undefined
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

  const baseFiltered = useMemo(() => {
    const sortedByTime = [...logs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    if (sortedByTime.length === 0) return []

    // Use wall-clock time for ranges like "Last 1h" so stale historical data
    // does not shift the window and histogram captions unexpectedly.
    const nowTs = Date.now()
    const rangeMsMap: Record<typeof timeRange, number> = {
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      all: Number.MAX_SAFE_INTEGER,
    }

    const cutoff = nowTs - rangeMsMap[timeRange]

    const byTime = sortedByTime.filter(log => {
      if (timeRange === 'all') return true
      return new Date(log.timestamp).getTime() >= cutoff
    })

    const byQuery = byTime.filter(log => {
      if (!query.trim()) return true

      if (isLuceneMode) {
        return luceneMatch(log, query)
      }

      return `${log.service} ${log.message} ${log.level} ${JSON.stringify(log.metadata ?? {})}`
        .toLowerCase()
        .includes(query.toLowerCase())
    })

    return activeTab === 'exceptions' ? byQuery.filter(log => log.level === 'ERROR') : byQuery
  }, [logs, query, isLuceneMode, timeRange, activeTab])

  const appendFieldFilter = (field: string) => {
    setIsLuceneMode(true)
    setQuery(prev => {
      const token = `${field}:`
      if (prev.includes(token)) return prev
      return prev.trim() ? `${prev} ${token}` : token
    })
  }

  const histogram = useMemo((): InternalHistogramBucket[] => {
    if (baseFiltered.length === 0) return []

    const timestamps = baseFiltered.map(item => new Date(item.timestamp).getTime())
    const latestTs = Math.max(...timestamps)
    const earliestTs = Math.min(...timestamps)

    // timeRange에 따른 범위 계산
    const nowTs = Date.now()
    const rangeMsMap: Record<typeof timeRange, number> = {
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      all: Number.MAX_SAFE_INTEGER,
    }

    const durationMs = timeRange === 'all' ? latestTs - earliestTs : rangeMsMap[timeRange]

    // timeRange에 따른 버킷 사이즈
    const intervalByRange: Record<typeof timeRange, number> = {
      '15m': 60 * 1000, // 1분
      '1h': 5 * 60 * 1000, // 5분
      '6h': 15 * 60 * 1000, // 15분
      '24h': 60 * 60 * 1000, // 1시간
      all: 0,
    }

    let interval
    if (timeRange === 'all') {
      const rawInterval = Math.max(Math.ceil(durationMs / 30), 1000)
      const niceSteps = [
        1000,
        5000,
        10000,
        30000,
        60000,
        5 * 60000,
        10 * 60000,
        30 * 60000,
        60 * 60000,
        2 * 60 * 60000,
        6 * 60 * 60000,
        12 * 60 * 60000,
        24 * 60 * 60000,
      ]
      interval = niceSteps.find(step => step >= rawInterval) ?? rawInterval
    } else {
      interval = intervalByRange[timeRange]
    }

    const bucketCount = timeRange === 'all' ? 30 : Math.min(Math.ceil(durationMs / interval), 60)

    const alignedLatest = Math.ceil(latestTs / interval) * interval
    const start =
      timeRange === 'all'
        ? Math.floor(earliestTs / interval) * interval
        : alignedLatest - bucketCount * interval
    const totalBuckets =
      timeRange === 'all' ? Math.max(1, Math.ceil((alignedLatest - start) / interval)) : bucketCount

    const buckets = Array.from({ length: totalBuckets }, (_, idx) => {
      const bucketStartTs = start + idx * interval
      return {
        key: bucketStartTs,
        label: new Date(bucketStartTs),
        count: 0,
        debug: 0,
        info: 0,
        warn: 0,
        error: 0,
        interval,
        bucketStart: new Date(bucketStartTs),
        bucketEnd: new Date(bucketStartTs + interval),
      }
    })

    const bucketMap = new Map(buckets.map(bucket => [bucket.key, bucket]))

    for (const item of baseFiltered) {
      const ts = new Date(item.timestamp).getTime()
      const bucketKey = Math.floor(ts / interval) * interval
      const bucket = bucketMap.get(bucketKey)
      if (!bucket) continue

      bucket.count += 1
      if (item.level === 'ERROR') {
        bucket.error += 1
      } else if (item.level === 'WARN') {
        bucket.warn += 1
      } else if (item.level === 'DEBUG') {
        bucket.debug += 1
      } else {
        bucket.info += 1
      }
    }

    return buckets
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
  }, [query, timeRange, isLuceneMode, activeTab, selectedBucketKey])

  if (isLogsLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Logs
        </Typography>
        <Paper
          variant="outlined"
          sx={{ borderColor: 'divider', bgcolor: 'background.paper', p: 1.5 }}
        >
          <Stack gap={1.25}>
            <Skeleton variant="rounded" height={40} />
            <Skeleton variant="rounded" height={220} />
            <Skeleton variant="rounded" height={260} />
          </Stack>
        </Paper>
      </Box>
    )
  }

  if (isLogsFetched && logs?.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Logs
        </Typography>
        <NoDataState title="No logs data" description="로그 데이터를 찾지 못했습니다." />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
        Logs
      </Typography>

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
            isLuceneMode={isLuceneMode}
            onLuceneModeChange={setIsLuceneMode}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            onRefresh={refetch}
            isLiveEnabled={isLiveEnabled}
            onLiveEnabledChange={setIsLiveEnabled}
            isLiveStreaming={isLiveStreaming}
          />
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '300px 1fr' },
            minHeight: 520,
          }}
        >
          <FieldExplorer
            fieldSearch={fieldSearch}
            onFieldSearchChange={setFieldSearch}
            filteredFields={filteredFields}
            onAppendFieldFilter={appendFieldFilter}
          />

          <Box sx={{ p: 1.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center', mb: 1 }}>
              {filtered.length.toLocaleString()} hits
            </Typography>

            {filtered.length === 0 ? (
              <NoDataState
                title="No matching logs"
                description="조건에 맞는 로그를 찾지 못했습니다."
              />
            ) : (
              <>
                {selectedBucketKey !== null && (
                  <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
                    <Button size="small" variant="text" onClick={() => setSelectedBucketKey(null)}>
                      Clear bucket filter
                    </Button>
                  </Stack>
                )}

                {/* 동적 차트 렌더링 */}
                <LogsHistogram
                  histogramData={histogramData}
                  maxBucket={maxBucket}
                  selectedBucketKey={selectedBucketKey}
                  onSelectBucket={setSelectedBucketKey}
                />

                <ToggleButtonGroup
                  exclusive
                  value={activeTab}
                  onChange={(_, value) => value && setActiveTab(value)}
                  size="small"
                  sx={{ mb: 1.5 }}
                >
                  <ToggleButton value="logs">Logs</ToggleButton>
                  <ToggleButton value="patterns">Patterns</ToggleButton>
                  <ToggleButton value="exceptions">Exceptions ({exceptionCount})</ToggleButton>
                </ToggleButtonGroup>

                <Box
                  onScroll={handleTableScroll}
                  sx={{
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
