'use client';

import { memo, UIEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Drawer,
  Typography,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { apiClient } from '@/lib/apiClient';
import { formatDateTime } from '@/lib/formatters';
import LogsTable from '@/components/tables/LogsTable';
import { LogEntry } from '@/lib/types';

type LogStreamPayload = {
  cursor: number;
  ts: number;
  log: LogEntry;
};

type HistogramDataItem = {
  key: number;
  tsLabel: string;
  tsFullLabel: string;
  count: number;
  debug: number;
  info: number;
  warn: number;
  error: number;
};

type HistogramTooltipItem = {
  tsLabel?: string;
  tsFullLabel?: string;
  debug?: number;
  info?: number;
  warn?: number;
  error?: number;
  count?: number;
};

const formatAxisDateTime = (value: Date | number | string, withSeconds = false) => {
  const date = value instanceof Date ? value : new Date(value);
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const minute = String(date.getUTCMinutes()).padStart(2, '0');

  if (!withSeconds) {
    return `${month}-${dd} ${hh}:${minute}`;
  }

  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  return `${month}-${dd} ${hh}:${minute}:${ss}`;
};

const formatFullDateTime = (value: Date | number | string) => {
  const date = value instanceof Date ? value : new Date(value);
  const yyyy = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  return `${yyyy}-${month}-${day} ${hh}:${mm}:${ss}`;
};

const HistogramTooltip = memo(function HistogramTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: HistogramTooltipItem }>;
}) {
  const item = payload?.[0]?.payload;
  if (!active || !item) return null;

  const total = item.count ?? 0;
  const levels = [
    { key: 'DEBUG', value: item.debug ?? 0, color: '#34d399' },
    { key: 'INFO', value: item.info ?? 0, color: '#60a5fa' },
    { key: 'WARN', value: item.warn ?? 0, color: '#fbbf24' },
    { key: 'ERROR', value: item.error ?? 0, color: '#f87171' },
  ];

  return (
    <Box
      sx={{
        px: 1.25,
        py: 1,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
        minWidth: 220,
      }}
    >
      <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, mb: 0.5 }}>
        Datetime: {item.tsFullLabel ?? item.tsLabel}
      </Typography>
      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.75 }}>
        Total Logs: {total.toLocaleString()}
      </Typography>

      <Stack gap={0.4}>
        {levels.map((level) => {
          const ratio = total > 0 ? (level.value / total) * 100 : 0;
          return (
            <Stack key={level.key} direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={0.6} alignItems="center">
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: level.color,
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {level.key}
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {level.value.toLocaleString()} ({ratio.toFixed(1)}%)
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
});

const LogsHistogram = memo(function LogsHistogram({
  histogramData,
  maxBucket,
  selectedBucketKey,
  onSelectBucket,
}: {
  histogramData: HistogramDataItem[];
  maxBucket: number;
  selectedBucketKey: number | null;
  onSelectBucket: (bucketKey: number) => void;
}) {
  const getBucketOpacity = (bucketKey: number) => {
    if (selectedBucketKey !== null) {
      return selectedBucketKey === bucketKey ? 1 : 0.22;
    }

    return 1;
  };

  return (
    <Card
      variant="outlined"
      sx={{
        p: 1,
        borderColor: 'divider',
        bgcolor: 'background.default',
        mb: 1.5,
      }}
    >
      <CardContent sx={{ p: '8px !important' }}>
        <Box sx={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogramData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="tsLabel"
                minTickGap={28}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                domain={[0, Math.max(maxBucket, 1)]}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <Tooltip
                cursor={false}
                isAnimationActive={false}
                content={<HistogramTooltip />}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />

              <Bar dataKey="debug" stackId="levels" fill="#34d399" activeBar={{ fill: '#34d399', fillOpacity: 1, stroke: '#86efc6', strokeWidth: 1.2 }} onClick={(_, index) => {
                const bucket = histogramData[index];
                if (!bucket) return;
                onSelectBucket(bucket.key);
              }} isAnimationActive={false}>
                {histogramData.map((bucket) => (
                  <Cell
                    key={`bucket-debug-${bucket.key}`}
                    fill="#34d399"
                    fillOpacity={getBucketOpacity(bucket.key)}
                    stroke={selectedBucketKey === bucket.key ? '#ffffff' : 'none'}
                    strokeWidth={selectedBucketKey === bucket.key ? 1 : 0}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Bar>

              <Bar dataKey="info" stackId="levels" fill="#60a5fa" activeBar={{ fill: '#60a5fa', fillOpacity: 1, stroke: '#bfdbfe', strokeWidth: 1.2 }} onClick={(_, index) => {
                const bucket = histogramData[index];
                if (!bucket) return;
                onSelectBucket(bucket.key);
              }} isAnimationActive={false}>
                {histogramData.map((bucket) => (
                  <Cell
                    key={`bucket-info-${bucket.key}`}
                    fill="#60a5fa"
                    fillOpacity={getBucketOpacity(bucket.key)}
                    stroke={selectedBucketKey === bucket.key ? '#ffffff' : 'none'}
                    strokeWidth={selectedBucketKey === bucket.key ? 1 : 0}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Bar>

              <Bar dataKey="warn" stackId="levels" fill="#fbbf24" activeBar={{ fill: '#fbbf24', fillOpacity: 1, stroke: '#fde68a', strokeWidth: 1.2 }} onClick={(_, index) => {
                const bucket = histogramData[index];
                if (!bucket) return;
                onSelectBucket(bucket.key);
              }} isAnimationActive={false}>
                {histogramData.map((bucket) => (
                  <Cell
                    key={`bucket-warn-${bucket.key}`}
                    fill="#fbbf24"
                    fillOpacity={getBucketOpacity(bucket.key)}
                    stroke={selectedBucketKey === bucket.key ? '#ffffff' : 'none'}
                    strokeWidth={selectedBucketKey === bucket.key ? 1 : 0}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Bar>

              <Bar dataKey="error" stackId="levels" fill="#f87171" activeBar={{ fill: '#f87171', fillOpacity: 1, stroke: '#fecaca', strokeWidth: 1.2 }} radius={[3, 3, 0, 0]} onClick={(_, index) => {
                const bucket = histogramData[index];
                if (!bucket) return;
                onSelectBucket(bucket.key);
              }} isAnimationActive={false}>
                {histogramData.map((bucket) => (
                  <Cell
                    key={`bucket-error-${bucket.key}`}
                    fill="#f87171"
                    fillOpacity={getBucketOpacity(bucket.key)}
                    stroke={selectedBucketKey === bucket.key ? '#ffffff' : 'none'}
                    strokeWidth={selectedBucketKey === bucket.key ? 1.2 : 0}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'center' }}>
          @timestamp per auto interval
        </Typography>
      </CardContent>
    </Card>
  );
});

export default function LogsPage() {
  const PAGE_SIZE = 60;
  const { data: queryLogsData, refetch } = useQuery({ queryKey: ['logs'], queryFn: apiClient.getLogs });
  const queryLogs = queryLogsData ?? [];
  const [liveLogs, setLiveLogs] = useState<LogEntry[]>([]);
  const [isLiveEnabled, setIsLiveEnabled] = useState(true);
  const [streamStatus, setStreamStatus] = useState<'connecting' | 'live' | 'reconnecting' | 'offline'>('connecting');
  const lastLogCursorRef = useRef(0);
  const [query, setQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'logs' | 'patterns' | 'exceptions'>('logs');
  const [isLuceneMode, setIsLuceneMode] = useState(true);
  const [timeRange, setTimeRange] = useState<'15m' | '1h' | '6h' | '24h' | 'all'>('15m');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [fieldSearch, setFieldSearch] = useState('');
  const [selectedBucketKey, setSelectedBucketKey] = useState<number | null>(null);

  useEffect(() => {
    if (!queryLogsData) return;

    setLiveLogs(queryLogs);

    if (queryLogs.length > 0) {
      setStreamStatus('connecting');
    }
  }, [queryLogsData]);

  useEffect(() => {
    if (!isLiveEnabled) {
      setStreamStatus('offline');
      return;
    }

    const MAX_LOGS = 6000;
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let isUnmounted = false;
    let retryAttempt = 0;

    const applyLogPayload = (payload: LogStreamPayload) => {
      if (!payload?.log) return;

      setLiveLogs((prev) => {
        const deduped = prev.filter((log) => log.id !== payload.log.id);
        return [payload.log, ...deduped].slice(0, MAX_LOGS);
      });

      lastLogCursorRef.current = Math.max(lastLogCursorRef.current, payload.cursor ?? 0);
    };

    const fetchBacklog = async () => {
      let cursor = lastLogCursorRef.current;
      const limit = 300;

      try {
        for (let step = 0; step < 10; step += 1) {
          const response = await fetch(`/api/logs/backlog?cursor=${cursor}&limit=${limit}`);
          if (!response.ok) return;

          const data = (await response.json()) as {
            events?: LogStreamPayload[];
            nextCursor?: number;
            hasMore?: boolean;
            latestCursor?: number;
          };

          (data.events ?? []).forEach((event) => applyLogPayload(event));

          cursor = Math.max(cursor, data.nextCursor ?? cursor);
          lastLogCursorRef.current = Math.max(
            lastLogCursorRef.current,
            data.latestCursor ?? cursor,
          );

          if (!data.hasMore) break;
        }
      } catch {
        // ignore backlog fetch failure and continue with live stream
      }
    };

    const connect = async () => {
      if (isUnmounted) return;

      setStreamStatus(retryAttempt === 0 ? 'connecting' : 'reconnecting');
      await fetchBacklog();
      if (isUnmounted) return;

      eventSource = new EventSource('/api/logs/stream');

      eventSource.onopen = () => {
        retryAttempt = 0;
        setStreamStatus('live');
      };

      eventSource.addEventListener('log', (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent<string>).data) as LogStreamPayload;
          applyLogPayload(payload);
        } catch {
          // ignore malformed stream event
        }
      });

      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;

        if (isUnmounted) return;
        setStreamStatus('reconnecting');
        retryAttempt += 1;
        const delay = Math.min(5000, 1000 * 2 ** Math.min(retryAttempt, 3));
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      isUnmounted = true;
      setStreamStatus('offline');
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      eventSource?.close();
    };
  }, [isLiveEnabled]);

  const logs = useMemo(() => (liveLogs.length > 0 ? liveLogs : queryLogs), [liveLogs, queryLogs]);

  const getFieldValue = (log: LogEntry, field: string) => {
    const normalizedField = field.toLowerCase();
    const metadata = log.metadata ?? {};
    const tags = log.tags ?? {};

    if (normalizedField === 'service') return log.service;
    if (normalizedField === 'message') return log.message;
    if (normalizedField === 'level') return log.level;
    if (normalizedField === 'env') return log.env;
    if (normalizedField === 'traceid') return metadata.traceId;
    if (normalizedField === 'requestid') return metadata.requestId;
    if (normalizedField.startsWith('tag.')) return tags[normalizedField.replace('tag.', '')];

    const metadataEntry = Object.entries(metadata).find(([key]) => key.toLowerCase() === normalizedField);
    if (metadataEntry) return metadataEntry[1];

    return undefined;
  };

  const luceneMatch = (log: LogEntry, rawQuery: string) => {
    const tokens = rawQuery.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
    if (tokens.length === 0) return true;

    return tokens.every((token) => {
      const cleanedToken = token.replace(/^"|"$/g, '');
      const separatorIndex = cleanedToken.indexOf(':');

      if (separatorIndex > 0) {
        const field = cleanedToken.slice(0, separatorIndex);
        const expectedRaw = cleanedToken.slice(separatorIndex + 1);
        const expected = expectedRaw.replace(/^"|"$/g, '').toLowerCase();
        const actual = String(getFieldValue(log, field) ?? '').toLowerCase();
        return actual.includes(expected);
      }

      const searchable = `${log.service} ${log.env} ${log.level} ${log.message} ${JSON.stringify(log.metadata ?? {})}`.toLowerCase();
      return searchable.includes(cleanedToken.toLowerCase());
    });
  };

  const baseFiltered = useMemo(() => {
    const sortedByTime = [...logs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (sortedByTime.length === 0) return [];

    const latestTs = new Date(sortedByTime[0].timestamp).getTime();
    const rangeMsMap: Record<typeof timeRange, number> = {
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      all: Number.MAX_SAFE_INTEGER,
    };

    const cutoff = latestTs - rangeMsMap[timeRange];

    const byTime = sortedByTime.filter((log) => {
      if (timeRange === 'all') return true;
      return new Date(log.timestamp).getTime() >= cutoff;
    });

    const byQuery = byTime.filter((log) => {
      if (!query.trim()) return true;

      if (isLuceneMode) {
        return luceneMatch(log, query);
      }

      return `${log.service} ${log.message} ${log.level} ${JSON.stringify(log.metadata ?? {})}`
        .toLowerCase()
        .includes(query.toLowerCase());
    });

    return activeTab === 'exceptions'
      ? byQuery.filter((log) => log.level === 'ERROR')
      : byQuery;
  }, [logs, query, isLuceneMode, timeRange, activeTab]);

  const appendFieldFilter = (field: string) => {
    setIsLuceneMode(true);
    setQuery((prev) => {
      const token = `${field}:`;
      if (prev.includes(token)) return prev;
      return prev.trim() ? `${prev} ${token}` : token;
    });
  };

  const histogram = useMemo(() => {
    if (baseFiltered.length === 0) return [];

    const timestamps = baseFiltered.map((item) => new Date(item.timestamp).getTime());
    const latestTs = Math.max(...timestamps);
    const earliestTs = Math.min(...timestamps);
    const bucketCount = 30;

    const fixedIntervalByRange: Record<typeof timeRange, number> = {
      '15m': 30 * 1000,
      '1h': 2 * 60 * 1000,
      '6h': 12 * 60 * 1000,
      '24h': 48 * 60 * 1000,
      all: 0,
    };

    let interval = fixedIntervalByRange[timeRange];
    if (timeRange === 'all') {
      const rawInterval = Math.max(Math.ceil((latestTs - earliestTs) / bucketCount), 1000);
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
      ];
      interval = niceSteps.find((step) => step >= rawInterval) ?? rawInterval;
    }

    const alignedLatest = Math.ceil(latestTs / interval) * interval;
    const start = timeRange === 'all'
      ? Math.floor(earliestTs / interval) * interval
      : alignedLatest - bucketCount * interval;
    const totalBuckets = timeRange === 'all'
      ? Math.max(1, Math.ceil((alignedLatest - start) / interval))
      : bucketCount;

    const buckets = Array.from({ length: totalBuckets }, (_, idx) => {
      const bucketStart = start + idx * interval;
      return {
        key: bucketStart,
        label: new Date(bucketStart),
        count: 0,
        debug: 0,
        info: 0,
        warn: 0,
        error: 0,
        start,
        end: alignedLatest,
        interval,
      };
    });

    const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

    for (const item of baseFiltered) {
      const ts = new Date(item.timestamp).getTime();
      const bucketKey = Math.floor(ts / interval) * interval;
      const bucket = bucketMap.get(bucketKey);
      if (!bucket) continue;

      bucket.count += 1;
      if (item.level === 'ERROR') {
        bucket.error += 1;
      } else if (item.level === 'WARN') {
        bucket.warn += 1;
      } else if (item.level === 'DEBUG') {
        bucket.debug += 1;
      } else {
        bucket.info += 1;
      }
    }

    return buckets;
  }, [baseFiltered]);

  const filtered = useMemo(() => {
    if (selectedBucketKey === null || histogram.length === 0) {
      return baseFiltered;
    }

    const bucket = histogram.find((item) => item.key === selectedBucketKey);
    if (!bucket) {
      return baseFiltered;
    }

    const bucketStart = bucket.start + bucket.key * bucket.interval;
    const bucketStartFixed = bucket.key;
    const bucketEnd = bucketStartFixed + bucket.interval;

    return baseFiltered.filter((log) => {
      const ts = new Date(log.timestamp).getTime();
      return ts >= bucketStartFixed && ts < bucketEnd;
    });
  }, [baseFiltered, histogram, selectedBucketKey]);

  const visibleLogs = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMoreLogs = visibleCount < filtered.length;

  const handleTableScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!hasMoreLogs) return;

    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
    if (scrollHeight - (scrollTop + clientHeight) < 120) {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filtered.length));
    }
  };

  const maxBucket = Math.max(...histogram.map((bucket) => bucket.count), 1);

  const histogramData = useMemo(
    () =>
      histogram.map((bucket) => ({
        ...bucket,
        tsLabel: formatAxisDateTime(bucket.label, bucket.interval < 60 * 1000),
        tsFullLabel: formatFullDateTime(bucket.label),
      })),
    [histogram],
  );

  const fieldCandidates = useMemo(() => {
    const baseFields = ['@timestamp', 'service', 'level', 'message', 'env', 'traceId', 'requestId'];
    const dynamicFields = new Set<string>();

    for (const item of logs) {
      Object.keys(item.metadata ?? {}).forEach((field) => dynamicFields.add(field));
      Object.keys(item.tags ?? {}).forEach((field) => dynamicFields.add(`tag.${field}`));
    }

    const merged = [...baseFields, ...Array.from(dynamicFields)];
    const uniqueOrdered = Array.from(new Set(merged));

    return uniqueOrdered.slice(0, 20);
  }, [logs]);

  const filteredFields = useMemo(() => {
    if (!fieldSearch.trim()) return fieldCandidates;
    return fieldCandidates.filter((field) =>
      field.toLowerCase().includes(fieldSearch.toLowerCase())
    );
  }, [fieldCandidates, fieldSearch]);

  const exceptionCount = filtered.filter((item) => item.level === 'ERROR').length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, timeRange, isLuceneMode, activeTab, selectedBucketKey]);

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
        <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} gap={1}>
            <TextField
              fullWidth
              placeholder="Search logs (Lucene style)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              size="small"
            />
            <Button
              variant={isLuceneMode ? 'contained' : 'outlined'}
              size="small"
              sx={{ whiteSpace: 'nowrap', px: 2 }}
              onClick={() => setIsLuceneMode((prev) => !prev)}
            >
              {isLuceneMode ? 'Lucene ON' : 'Lucene OFF'}
            </Button>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
              >
                <MenuItem value="15m">Last 15m</MenuItem>
                <MenuItem value="1h">Last 1h</MenuItem>
                <MenuItem value="6h">Last 6h</MenuItem>
                <MenuItem value="24h">Last 24h</MenuItem>
                <MenuItem value="all">All Time</MenuItem>
              </Select>
            </FormControl>
            <Button variant="contained" size="small" sx={{ whiteSpace: 'nowrap', px: 2 }} onClick={() => refetch()}>
              Refresh
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setIsLiveEnabled((prev) => !prev)}
              sx={{
                minWidth: 72,
                px: 1,
                py: 0.25,
                borderRadius: 999,
                borderColor: isLiveEnabled ? 'success.main' : 'divider',
                color: isLiveEnabled ? 'success.main' : 'text.secondary',
                alignSelf: 'center',
                '@keyframes neonPulse': {
                  '0%, 100%': { opacity: 1, textShadow: '0 0 6px rgba(74, 222, 128, 0.75), 0 0 12px rgba(74, 222, 128, 0.45)' },
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
                    animation: isLiveEnabled && streamStatus === 'live' ? 'neonPulse 1.2s ease-in-out infinite' : 'none',
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: 0.5,
                    color: isLiveEnabled ? 'success.main' : 'text.secondary',
                    animation: isLiveEnabled && streamStatus === 'live' ? 'neonPulse 1.2s ease-in-out infinite' : 'none',
                  }}
                >
                  LIVE
                </Typography>
              </Stack>
            </Button>
          </Stack>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '300px 1fr' },
            minHeight: 520,
          }}
        >
          <Box sx={{ borderRight: { lg: '1px solid' }, borderColor: 'divider', p: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Search these accounts
            </Typography>
            <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 2 }}>
              <Chip label="Benchmarks" size="small" />
              <Chip label="Jenkins Tests Logs" size="small" />
              <Chip label="LogTech Prod" size="small" />
            </Stack>

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Field Explorer
            </Typography>
            <TextField
              placeholder="Search field names"
              size="small"
              fullWidth
              sx={{ mb: 1 }}
              value={fieldSearch}
              onChange={(e) => setFieldSearch(e.target.value)}
            />
            <Divider sx={{ my: 1 }} />
            <Stack gap={0.5} sx={{ maxHeight: 310, overflowY: 'auto' }}>
              {filteredFields.map((field) => (
                <Button
                  key={field}
                  size="small"
                  variant="text"
                  onClick={() => appendFieldFilter(field)}
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    color: 'text.secondary',
                    px: 0.5,
                    minHeight: 28,
                  }}
                >
                  {field}
                </Button>
              ))}
            </Stack>
          </Box>

          <Box sx={{ p: 1.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center', mb: 1 }}>
              {filtered.length.toLocaleString()} hits
            </Typography>

            {selectedBucketKey !== null && (
              <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
                <Button size="small" variant="text" onClick={() => setSelectedBucketKey(null)}>
                  Clear bucket filter
                </Button>
              </Stack>
            )}

            <LogsHistogram
              histogramData={histogramData}
              maxBucket={maxBucket}
              selectedBucketKey={selectedBucketKey}
              onSelectBucket={(bucketKey) =>
                setSelectedBucketKey((prev) => (prev === bucketKey ? null : bucketKey))
              }
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
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Showing {visibleLogs.length.toLocaleString()} of {filtered.length.toLocaleString()} logs
              {hasMoreLogs ? ' · Scroll down to load more' : ''}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Selected Log Detail Drawer */}
      <Drawer
        anchor="right"
        open={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        PaperProps={{
          sx: {
            width: 384,
            bgcolor: (theme) => theme.palette.background.paper,
            borderLeft: '1px solid',
            borderColor: (theme) => theme.palette.divider,
          },
        }}
      >
        {selectedLog && (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Log Detail
              </Typography>
              <IconButton
                onClick={() => setSelectedLog(null)}
                size="small"
                sx={{ color: (theme) => theme.palette.text.secondary }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary }}>
              ID: {selectedLog.id}
            </Typography>
            <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary }}>
              Timestamp: {formatDateTime(selectedLog.timestamp)}
            </Typography>
            <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary }}>
              Service: {selectedLog.service}
            </Typography>
            <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary }}>
              Level: {selectedLog.level}
            </Typography>
            <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary }}>
              Message: {selectedLog.message}
            </Typography>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}
