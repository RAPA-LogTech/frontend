'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MetricSeries } from '@/lib/types';
import { apiClient } from '@/lib/apiClient';

type MetricStreamPayload = {
  ts: number;
  points: Array<{
    id: string;
    ts: number;
    value: number;
  }>;
};

const formatMetricValue = (value: number, unit: string) => {
  if (unit === 'req/s') {
    return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0);
  }
  if (unit === '%') {
    return value.toFixed(2);
  }
  if (unit === 'ms') {
    return value.toFixed(0);
  }
  return value.toFixed(1);
};

const getSeriesStats = (series: MetricSeries) => {
  const values = series.points.map((point) => point.value);
  const last = values[values.length - 1] ?? 0;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
  return { last, min, max, avg };
};

function MiniSparkline({ series, color }: { series: MetricSeries; color: string }) {
  if (series.points.length === 0) {
    return <Box sx={{ height: 30, width: '100%' }} />;
  }

  const smoothValues = (values: number[], windowSize = 5) =>
    values.map((_, index) => {
      const start = Math.max(0, index - Math.floor(windowSize / 2));
      const end = Math.min(values.length - 1, index + Math.floor(windowSize / 2));
      const slice = values.slice(start, end + 1);
      return slice.reduce((sum, value) => sum + value, 0) / slice.length;
    });

  const values = series.points.map((point) => point.value);
  const smoothed = smoothValues(values, 7);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(1, max - min);
  const paddedMin = Math.max(0, min - spread * 0.15);
  const paddedMax = max + spread * 0.15;

  const sparkData = series.points.map((point, index) => ({
    idx: index,
    value: smoothed[index] ?? point.value,
  }));

  return (
    <Box sx={{ height: 32, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`kpi-grad-${series.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={`url(#kpi-grad-${series.id})`}
            strokeWidth={2.2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.2}
            dot={false}
            isAnimationActive={false}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <YAxis hide domain={[paddedMin, paddedMax]} />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}

function TimeSeriesPanel({
  title,
  seriesList,
  chartType = 'line',
}: {
  title: string;
  seriesList: MetricSeries[];
  chartType?: 'line' | 'area';
}) {
  const theme = useTheme();
  const palette = [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.info.main,
  ];

  const allValues = seriesList.flatMap((series) => series.points.map((point) => point.value));
  if (seriesList.length === 0 || allValues.length === 0) {
    return (
      <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            No data
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const basePoints = seriesList[0].points;
  const chartData = basePoints.map((point, index) => {
    const row: Record<string, number | string> = {
      ts: point.ts,
      label: new Date(point.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    seriesList.forEach((series) => {
      row[series.id] = series.points[index]?.value ?? 0;
    });

    return row;
  });

  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const padding = (max - min) * 0.08;
  const domainMin = Math.max(0, min - padding);
  const domainMax = max + padding;

  return (
    <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary' }}>
          {title}
        </Typography>
        <Box sx={{ height: 220, borderRadius: 1, bgcolor: 'background.default', p: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                <defs>
                  {seriesList.map((series, index) => (
                    <linearGradient key={`grad-${series.id}`} id={`grad-${series.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={palette[index % palette.length]} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={palette[index % palette.length]} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid stroke={theme.palette.divider} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: theme.palette.divider }}
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: theme.palette.divider }}
                  width={44}
                  domain={[domainMin, domainMax]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: theme.palette.text.secondary }}
                  formatter={(value: number, key: string) => {
                    const series = seriesList.find((item) => item.id === key);
                    return [`${formatMetricValue(value, series?.unit ?? '')} ${series?.unit ?? ''}`, series?.name ?? key];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {seriesList.map((series, index) => (
                  <Area
                    key={series.id}
                    type="monotone"
                    dataKey={series.id}
                    name={series.name}
                    stroke={palette[index % palette.length]}
                    fill={`url(#grad-${series.id})`}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                ))}
              </AreaChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                <CartesianGrid stroke={theme.palette.divider} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: theme.palette.divider }}
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: theme.palette.divider }}
                  width={44}
                  domain={[domainMin, domainMax]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: theme.palette.text.secondary }}
                  formatter={(value: number, key: string) => {
                    const series = seriesList.find((item) => item.id === key);
                    return [`${formatMetricValue(value, series?.unit ?? '')} ${series?.unit ?? ''}`, series?.name ?? key];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {seriesList.map((series, index) => (
                  <Line
                    key={series.id}
                    type="monotone"
                    dataKey={series.id}
                    name={series.name}
                    stroke={palette[index % palette.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </Box>
        <Stack direction="row" spacing={2} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
          {seriesList.map((series, index) => (
            <Stack key={series.id} direction="row" spacing={0.75} alignItems="center">
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: palette[index % palette.length],
                }}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {series.name}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function MetricsPage() {
  const theme = useTheme();

  const { data: metrics = [] } = useQuery({
    queryKey: ['metrics'],
    queryFn: apiClient.getMetrics,
  });

  const [liveMetrics, setLiveMetrics] = useState<MetricSeries[]>([]);
  const [streamStatus, setStreamStatus] = useState<'connecting' | 'live' | 'reconnecting' | 'offline'>('connecting');

  useEffect(() => {
    setLiveMetrics(metrics);
    if (metrics.length > 0) {
      setStreamStatus('connecting');
    }
  }, [metrics]);

  useEffect(() => {
    if (metrics.length === 0) {
      setStreamStatus('offline');
      return;
    }

    const MAX_POINTS = 120;
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let isUnmounted = false;
    let retryAttempt = 0;

    const connect = () => {
      if (isUnmounted) return;

      setStreamStatus(retryAttempt === 0 ? 'connecting' : 'reconnecting');
      eventSource = new EventSource('/api/metrics/stream');

      eventSource.onopen = () => {
        retryAttempt = 0;
        setStreamStatus('live');
      };

      eventSource.addEventListener('metric', (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent<string>).data) as MetricStreamPayload;
          const updates = new Map(payload.points.map((point) => [point.id, point]));

          setLiveMetrics((prev) =>
            prev.map((series) => {
              const nextPoint = updates.get(series.id);
              if (!nextPoint) return series;

              const points = [...series.points, { ts: nextPoint.ts, value: nextPoint.value }];
              const trimmed = points.length > MAX_POINTS ? points.slice(points.length - MAX_POINTS) : points;

              return {
                ...series,
                points: trimmed,
              };
            }),
          );
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
  }, [metrics.length]);

  const metricSeries = useMemo(() => (liveMetrics.length > 0 ? liveMetrics : metrics), [liveMetrics, metrics]);

  const requestSeries = metricSeries.filter((series) => series.name.includes('request_rate'));
  const errorSeries = metricSeries.filter((series) => series.name.includes('error_rate'));
  const latencySeries = metricSeries.filter((series) => series.name.includes('latency_p95'));
  const resourceSeries = metricSeries.filter(
    (series) => series.name.includes('cpu_usage') || series.name.includes('memory_usage'),
  );

  const getLastValue = (series?: MetricSeries) => (series ? getSeriesStats(series).last : 0);

  const kpis = [
    {
      label: 'Total Throughput',
      unit: 'req/s',
      value: requestSeries.reduce((sum, series) => sum + getSeriesStats(series).last, 0),
      series: requestSeries[0],
      color: theme.palette.primary.main,
    },
    {
      label: 'Avg Error Rate',
      unit: '%',
      value:
        errorSeries.reduce((sum, series) => sum + getSeriesStats(series).last, 0) /
        Math.max(1, errorSeries.length),
      series: errorSeries[0],
      color: theme.palette.error.main,
    },
    {
      label: 'Checkout P95',
      unit: 'ms',
      value: getLastValue(latencySeries[0]),
      series: latencySeries[0],
      color: theme.palette.warning.main,
    },
    {
      label: 'CPU Headroom',
      unit: '%',
      value: Math.max(0, 100 - getLastValue(resourceSeries[0])),
      series: resourceSeries[0],
      color: theme.palette.success.main,
    },
  ];

  const totalPanels = [
    ...requestSeries,
    ...errorSeries,
    ...latencySeries,
    ...resourceSeries,
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }} justifyContent="space-between">
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Metrics
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" sx={{ color: streamStatus === 'live' ? 'success.main' : 'text.secondary', fontWeight: 700 }}>
            SSE {streamStatus.toUpperCase()}
          </Typography>
          <Button size="small" variant="outlined">Last 8h</Button>
          <Button size="small" variant="outlined" onClick={() => setLiveMetrics(metrics)}>Reset</Button>
        </Stack>
      </Stack>

      <TextField
        fullWidth
        label="PromQL (Advanced)"
        placeholder={'e.g. sum(rate(http_requests_total{service=~"checkout|api-gateway"}[5m])) by (service)'}
        helperText="Type a PromQL query to filter or compare metric series"
        size="small"
        InputLabelProps={{ shrink: true }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Typography
                variant="caption"
                sx={{
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 0.75,
                  border: '1px solid',
                  borderColor: 'divider',
                  color: 'text.secondary',
                  fontFamily: 'monospace',
                }}
              >
                query
              </Typography>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            bgcolor: 'background.paper',
            borderRadius: 1.25,
            '& fieldset': {
              borderColor: 'divider',
            },
            '&:hover fieldset': {
              borderColor: 'text.secondary',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'primary.main',
              borderWidth: 2,
            },
          },
          '& .MuiInputBase-input::placeholder': {
            opacity: 1,
            color: 'text.secondary',
            fontStyle: 'italic',
          },
          '& .MuiFormHelperText-root': {
            ml: 0.5,
          },
        }}
      />

      <Grid container spacing={2}>
        {kpis.map((kpi) => (
          <Grid item xs={12} sm={6} md={3} key={kpi.label}>
            <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: 'text.secondary',
                    display: 'block',
                  }}
                >
                  {kpi.label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>
                  {formatMetricValue(kpi.value, kpi.unit)} {kpi.unit}
                </Typography>
                {kpi.series ? (
                  <Box sx={{ mt: 1.5 }}>
                    <MiniSparkline series={kpi.series} color={kpi.color} />
                  </Box>
                ) : null}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <TimeSeriesPanel title="Request Rate by Service" seriesList={requestSeries} chartType="area" />
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                Live Metric Values
              </Typography>
              <Stack divider={<Divider flexItem />} spacing={1}>
                {totalPanels.map((series) => {
                  const stats = getSeriesStats(series);
                  return (
                    <Stack key={series.id} direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 0.75 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', pr: 1 }}>
                        {series.name}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatMetricValue(stats.last, series.unit)} {series.unit}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <TimeSeriesPanel title="Error Rate Trend" seriesList={errorSeries} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TimeSeriesPanel title="Latency p95 (ms)" seriesList={latencySeries} />
        </Grid>
        <Grid item xs={12}>
          <TimeSeriesPanel title="Resource Usage (CPU/Memory)" seriesList={resourceSeries} />
        </Grid>
      </Grid>
    </Box>
  );
}
