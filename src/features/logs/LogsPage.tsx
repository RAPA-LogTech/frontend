'use client';

import { memo, UIEvent, useEffect, useMemo, useState } from 'react';
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
import { formatTimestamp } from '@/lib/formatters';
import LogsTable from '@/components/tables/LogsTable';
import { LogEntry } from '@/lib/types';

type HistogramDataItem = {
  key: number;
  tsLabel: string;
  count: number;
  debug: number;
  info: number;
  warn: number;
  error: number;
};

type HistogramTooltipItem = {
  tsLabel?: string;
  debug?: number;
  info?: number;
  warn?: number;
  error?: number;
  count?: number;
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

  return (
    <Box
      sx={{
        px: 1,
        py: 0.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="caption" sx={{ display: 'block', fontWeight: 700 }}>
        {item.tsLabel} · {(item.count ?? 0).toLocaleString()} hits
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        D {(item.debug ?? 0).toLocaleString()} · I {(item.info ?? 0).toLocaleString()} · W {(item.warn ?? 0).toLocaleString()} · E {(item.error ?? 0).toLocaleString()}
      </Typography>
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
    const baseDimOpacity = 0.35;

    if (selectedBucketKey !== null) {
      return selectedBucketKey === bucketKey ? 1 : 0.22;
    }

    return baseDimOpacity;
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

              <Bar dataKey="debug" stackId="levels" fill="#64748b" activeBar={{ fill: '#64748b', fillOpacity: 1, stroke: '#cbd5e1', strokeWidth: 1.2 }} onClick={(_, index) => {
                const bucket = histogramData[index];
                if (!bucket) return;
                onSelectBucket(bucket.key);
              }} isAnimationActive={false}>
                {histogramData.map((bucket) => (
                  <Cell
                    key={`bucket-debug-${bucket.key}`}
                    fill="#64748b"
                    fillOpacity={getBucketOpacity(bucket.key)}
                    stroke={selectedBucketKey === bucket.key ? '#ffffff' : 'none'}
                    strokeWidth={selectedBucketKey === bucket.key ? 1 : 0}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Bar>

              <Bar dataKey="info" stackId="levels" fill="#3b82f6" activeBar={{ fill: '#3b82f6', fillOpacity: 1, stroke: '#93c5fd', strokeWidth: 1.2 }} onClick={(_, index) => {
                const bucket = histogramData[index];
                if (!bucket) return;
                onSelectBucket(bucket.key);
              }} isAnimationActive={false}>
                {histogramData.map((bucket) => (
                  <Cell
                    key={`bucket-info-${bucket.key}`}
                    fill="#3b82f6"
                    fillOpacity={getBucketOpacity(bucket.key)}
                    stroke={selectedBucketKey === bucket.key ? '#ffffff' : 'none'}
                    strokeWidth={selectedBucketKey === bucket.key ? 1 : 0}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Bar>

              <Bar dataKey="warn" stackId="levels" fill="#f59e0b" activeBar={{ fill: '#f59e0b', fillOpacity: 1, stroke: '#fcd34d', strokeWidth: 1.2 }} onClick={(_, index) => {
                const bucket = histogramData[index];
                if (!bucket) return;
                onSelectBucket(bucket.key);
              }} isAnimationActive={false}>
                {histogramData.map((bucket) => (
                  <Cell
                    key={`bucket-warn-${bucket.key}`}
                    fill="#f59e0b"
                    fillOpacity={getBucketOpacity(bucket.key)}
                    stroke={selectedBucketKey === bucket.key ? '#ffffff' : 'none'}
                    strokeWidth={selectedBucketKey === bucket.key ? 1 : 0}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Bar>

              <Bar dataKey="error" stackId="levels" fill="#ef4444" activeBar={{ fill: '#ef4444', fillOpacity: 1, stroke: '#fca5a5', strokeWidth: 1.2 }} radius={[3, 3, 0, 0]} onClick={(_, index) => {
                const bucket = histogramData[index];
                if (!bucket) return;
                onSelectBucket(bucket.key);
              }} isAnimationActive={false}>
                {histogramData.map((bucket) => (
                  <Cell
                    key={`bucket-error-${bucket.key}`}
                    fill="#ef4444"
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
  const { data: logs = [], refetch } = useQuery({ queryKey: ['logs'], queryFn: apiClient.getLogs });
  const [query, setQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'logs' | 'patterns' | 'exceptions'>('logs');
  const [isLuceneMode, setIsLuceneMode] = useState(true);
  const [timeRange, setTimeRange] = useState<'15m' | '1h' | '6h' | '24h' | 'all'>('15m');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [fieldSearch, setFieldSearch] = useState('');
  const [selectedBucketKey, setSelectedBucketKey] = useState<number | null>(null);

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

    const sorted = [...baseFiltered].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const start = new Date(sorted[0].timestamp).getTime();
    const end = new Date(sorted[sorted.length - 1].timestamp).getTime();
    const bucketCount = 30;
    const interval = Math.max(Math.floor((end - start) / bucketCount), 1000);

    const buckets = Array.from({ length: bucketCount }, (_, idx) => ({
      key: idx,
      label: new Date(start + idx * interval),
      count: 0,
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      start,
      end,
      interval,
    }));

    for (const item of sorted) {
      const idx = Math.min(
        Math.floor((new Date(item.timestamp).getTime() - start) / interval),
        bucketCount - 1
      );
      const bucket = buckets[idx];
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
    const bucketEnd = bucketStart + bucket.interval;

    return baseFiltered.filter((log) => {
      const ts = new Date(log.timestamp).getTime();
      return ts >= bucketStart && ts < bucketEnd;
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
        tsLabel: bucket.label.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
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
              Timestamp: {formatTimestamp(selectedLog.timestamp)}
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
