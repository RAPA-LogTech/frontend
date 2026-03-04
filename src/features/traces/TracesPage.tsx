'use client';

import Link from 'next/link';
import { UIEvent, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
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
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { apiClient } from '@/lib/apiClient';
import { formatTimestamp } from '@/lib/formatters';

type SortKey = 'recent' | 'duration';

export default function TracesPage() {
  const PAGE_SIZE = 30;
  const theme = useTheme();
  const { data: traces = [] } = useQuery({ queryKey: ['traces'], queryFn: apiClient.getTraces });
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [hoveredTraceId, setHoveredTraceId] = useState<string | null>(null);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showDependencyGraph, setShowDependencyGraph] = useState(false);

  const sortedTraces = useMemo(() => {
    const cloned = [...traces];
    if (sortKey === 'duration') {
      return cloned.sort((a, b) => b.duration - a.duration);
    }
    return cloned.sort((a, b) => b.startTime - a.startTime);
  }, [traces, sortKey]);

  const minStart = useMemo(() => Math.min(...sortedTraces.map((trace) => trace.startTime)), [sortedTraces]);
  const maxStart = useMemo(() => Math.max(...sortedTraces.map((trace) => trace.startTime)), [sortedTraces]);
  const minDuration = useMemo(() => Math.min(...sortedTraces.map((trace) => trace.duration)), [sortedTraces]);
  const maxDuration = useMemo(() => Math.max(...sortedTraces.map((trace) => trace.duration)), [sortedTraces]);

  const handleSortChange = (event: SelectChangeEvent<SortKey>) => {
    setSortKey(event.target.value as SortKey);
  };

  const getStatusColor = (statusCode?: number) => {
    if (!statusCode) return theme.palette.text.secondary;
    if (statusCode >= 500) return theme.palette.error.main;
    if (statusCode >= 400) return theme.palette.warning.main;
    if (statusCode >= 300) return theme.palette.warning.light;
    return theme.palette.success.main;
  };

  if (sortedTraces.length === 0) {
    return (
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Traces
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No traces found.
        </Typography>
      </Box>
    );
  }

  const timeRange = Math.max(maxStart - minStart, 1);
  const durationRange = Math.max(maxDuration - minDuration, 1);
  const hoveredTrace = hoveredTraceId
    ? sortedTraces.find((trace) => trace.id === hoveredTraceId) ?? null
    : null;

  const displayedTraces = selectedTraceId
    ? sortedTraces.filter((trace) => trace.id === selectedTraceId)
    : sortedTraces;

  const dependencyGraph = useMemo(() => {
    const edgeMap = new Map<string, { source: string; target: string; count: number }>();
    const services = new Set<string>();

    for (const trace of displayedTraces) {
      const spanById = new Map(trace.spans.map((span) => [span.id, span]));

      for (const span of trace.spans) {
        services.add(span.service);
        if (!span.parentSpanId) continue;

        const parent = spanById.get(span.parentSpanId);
        if (!parent) continue;
        services.add(parent.service);

        const source = parent.service;
        const target = span.service;
        if (source === target) continue;

        const key = `${source}->${target}`;
        const existing = edgeMap.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          edgeMap.set(key, { source, target, count: 1 });
        }
      }
    }

    return {
      nodes: Array.from(services).sort(),
      edges: Array.from(edgeMap.values()).sort((a, b) => b.count - a.count),
    };
  }, [displayedTraces]);

  const visibleTraces = useMemo(() => displayedTraces.slice(0, visibleCount), [displayedTraces, visibleCount]);
  const hasMoreTraces = visibleCount < displayedTraces.length;

  const handleTraceListScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!hasMoreTraces) return;

    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
    if (scrollHeight - (scrollTop + clientHeight) < 140) {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, displayedTraces.length));
    }
  };

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [sortKey, selectedTraceId]);

  const handleDownloadResults = () => {
    const escapeCsv = (value: string | number | null | undefined) => {
      const text = String(value ?? '');
      const escaped = text.replace(/"/g, '""');
      return `"${escaped}"`;
    };

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
    ];

    const rows = displayedTraces.map((trace) => {
      const serviceCounts = trace.spans.reduce<Record<string, number>>((accumulator, span) => {
        accumulator[span.service] = (accumulator[span.service] ?? 0) + 1;
        return accumulator;
      }, {});

      const topServices = Object.entries(serviceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([service, count]) => `${service}(${count})`)
        .join(', ');

      const errorSpanCount = trace.spans.filter((span) => span.status === 'error').length;

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
      ];
    });

    const csvContent = [
      header.map(escapeCsv).join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    anchor.href = url;
    anchor.download = `traces-results-${timestamp}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const yAxisTicks = [1, 0.75, 0.5, 0.25, 0].map((ratio) => ({
    ratio,
    value: minDuration + durationRange * ratio,
  }));

  const xAxisTicks = [0, 0.33, 0.66, 1].map((ratio) => ({
    ratio,
    value: new Date(minStart + timeRange * ratio),
  }));

  const getDotMeta = (trace: (typeof sortedTraces)[number]) => {
    const x = ((trace.startTime - minStart) / timeRange) * 92 + 4;
    const y = 92 - ((trace.duration - minDuration) / durationRange) * 70;
    const size = 6 + ((trace.duration - minDuration) / durationRange) * 18;

    return { x, y, size };
  };

  const hoveredMeta = hoveredTrace ? getDotMeta(hoveredTrace) : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        Traces
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: { xs: 1.5, md: 2 },
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            height: 220,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'background.default',
            overflow: 'visible',
          }}
        >
          <Typography variant="caption" sx={{ position: 'absolute', left: 8, top: 8, color: 'text.secondary' }}>
            Duration
          </Typography>
          <Typography variant="caption" sx={{ position: 'absolute', right: 8, bottom: 8, color: 'text.secondary' }}>
            Time
          </Typography>

          {yAxisTicks.map((tick) => (
            <Box
              key={`y-${tick.ratio}`}
              sx={{
                position: 'absolute',
                left: '4%',
                right: '4%',
                top: `${92 - tick.ratio * 70}%`,
                borderTop: '1px dashed',
                borderColor: 'divider',
                opacity: 0.45,
                zIndex: 0,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  left: '-2px',
                  top: -8,
                  transform: 'translateX(-100%)',
                  color: 'text.secondary',
                  fontSize: '0.64rem',
                }}
              >
                {tick.value.toFixed(0)}ms
              </Typography>
            </Box>
          ))}

          {xAxisTicks.map((tick, idx) => (
            <Box
              key={`x-${tick.ratio}`}
              sx={{
                position: 'absolute',
                left: `${tick.ratio * 92 + 4}%`,
                top: '22%',
                bottom: '8%',
                borderLeft: '1px dashed',
                borderColor: 'divider',
                opacity: 0.35,
                zIndex: 0,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  bottom: -18,
                  left: idx === 0 ? 0 : '50%',
                  transform: idx === 0 ? 'translateX(0)' : 'translateX(-50%)',
                  color: 'text.secondary',
                  fontSize: '0.64rem',
                  whiteSpace: 'nowrap',
                }}
              >
                {tick.value.toLocaleTimeString()}
              </Typography>
            </Box>
          ))}

          {hoveredTrace && hoveredMeta && (
            <Paper
              elevation={3}
              sx={{
                position: 'absolute',
                left: `${hoveredMeta.x}%`,
                top: `clamp(8px, calc(${hoveredMeta.y}% - 56px), 170px)`,
                transform: 'translateX(-50%)',
                px: 1,
                py: 0.75,
                zIndex: 3,
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <Typography variant="caption" sx={{ display: 'block', fontWeight: 700 }}>
                {hoveredTrace.service}: {hoveredTrace.operation}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {hoveredTrace.duration.toFixed(2)}ms · {formatTimestamp(hoveredTrace.startTime)}
              </Typography>
            </Paper>
          )}

          {sortedTraces.map((trace) => {
            const { x, y, size } = getDotMeta(trace);
            const isSelected = selectedTraceId === trace.id;
            const isDimmed = selectedTraceId !== null && !isSelected;

            return (
              <Box
                key={`dot-${trace.id}`}
                onMouseEnter={() => setHoveredTraceId(trace.id)}
                onMouseLeave={() => setHoveredTraceId(null)}
                onClick={() =>
                  setSelectedTraceId((prev) => (prev === trace.id ? null : trace.id))
                }
                sx={{
                  position: 'absolute',
                  left: `${x}%`,
                  top: `${y}%`,
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  bgcolor: getStatusColor(trace.status_code),
                  opacity: isDimmed ? 0.35 : hoveredTraceId === trace.id || isSelected ? 1 : 0.8,
                  outline: isSelected ? '2px solid rgba(255,255,255,0.75)' : 'none',
                  cursor: 'pointer',
                  transition: 'opacity 0.12s ease',
                }}
              />
            );
          })}
        </Box>
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

        <Box sx={{ p: 2, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Compare traces by selecting result items
          </Typography>
        </Box>

        <Box
          sx={{ p: 1.5, maxHeight: 520, overflowY: 'auto' }}
          onScroll={handleTraceListScroll}
        >
          <Stack gap={1.5}>
            {visibleTraces.map((trace) => {
            const serviceCounts = trace.spans.reduce<Record<string, number>>((accumulator, span) => {
              accumulator[span.service] = (accumulator[span.service] ?? 0) + 1;
              return accumulator;
            }, {});

            const errorCount = trace.spans.filter((span) => span.status === 'error').length;
            const topServices = Object.entries(serviceCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5);

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
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, py: 1.5, bgcolor: 'action.hover' }}>
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
                    {trace.duration.toFixed(2)}ms
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
                      <Chip key={`${trace.id}-${service}`} size="small" label={`${service} (${count})`} variant="outlined" />
                    ))}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {formatTimestamp(trace.startTime)}
                  </Typography>
                </Stack>
              </Paper>
            );
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
              {dependencyGraph.nodes.map((node) => (
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
                <Typography variant="caption" sx={{ fontWeight: 700 }}>Source</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>Target</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>Calls</Typography>
              </Box>

              <Box sx={{ maxHeight: 280, overflowY: 'auto' }}>
                {dependencyGraph.edges.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
                    No cross-service dependencies found in current result set.
                  </Typography>
                ) : (
                  dependencyGraph.edges.map((edge) => (
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
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{edge.count}</Typography>
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
