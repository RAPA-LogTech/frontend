'use client'

import { Fragment, useMemo } from 'react'
import type { Theme } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { Box, Paper, Skeleton, Typography, useTheme } from '@mui/material'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Bar,
  BarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { MetricSeries } from '@/lib/types'
import { getContainerMetrics, getHostMetrics } from '@/lib/apiClient'
import NoDataState from '@/components/common/NoDataState'
import { getSeriesLast, filterByEnv } from '../metricsUtils'
import { SectionLabel } from '../MetricsShared'

async function getJvmMetrics(): Promise<MetricSeries[]> {
  try {
    const res = await fetch('/api/observability/metrics/jvm')
    if (!res.ok) return []
    const data = await res.json()
    if (Array.isArray(data)) return data as MetricSeries[]
    if (data?.metrics && Array.isArray(data.metrics)) return data.metrics as MetricSeries[]
    return []
  } catch {
    return []
  }
}

const BYTES_PER_MB = 1024 * 1024
const SVC_COLORS = [
  '#60a5fa',
  '#4ade80',
  '#fbbf24',
  '#a78bfa',
  '#fb923c',
  '#34d399',
  '#f87171',
  '#e879f9',
]

interface Props {
  envFilter: string
}

function filterSeries(series: MetricSeries[], name: string, envFilter: string) {
  return series.filter(s => s.name.includes(name) && filterByEnv(s, envFilter))
}
function filterJvmSeries(series: MetricSeries[], name: string, envFilter: string) {
  return series.filter(s => {
    if (!(s.name.includes(name) || s.name.endsWith(name.replace('app_', '')))) return false
    if (envFilter === 'all') return true
    const env = (s as MetricSeries & { env?: string }).env
    return env ? env === envFilter : false
  })
}
function getHostKey(s: MetricSeries) {
  return s.instance || s.service || 'unknown-host'
}
function formatBytes(v: number) {
  if (!Number.isFinite(v) || v <= 0) return '0 B'
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB']
  const exp = Math.min(Math.floor(Math.log(v) / Math.log(1024)), units.length - 1)
  const n = v / 1024 ** exp
  return `${n.toFixed(n >= 100 ? 0 : n >= 10 ? 1 : 2)} ${units[exp]}`
}
function buildTimes(seriesList: (MetricSeries | undefined)[], limit = 30) {
  const set = new Set<number>()
  seriesList.forEach(s => s?.points.forEach(p => set.add(p.ts)))
  return Array.from(set).sort().slice(-limit)
}
function toTime(ts: number) {
  return new Date(ts).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function StatRow({
  label,
  value,
  color,
  sub,
}: {
  label: string
  value: string
  color: string
  sub?: string
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 0.875,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          {label}
        </Typography>
        {sub && (
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', display: 'block', fontSize: 10 }}
          >
            {sub}
          </Typography>
        )}
      </Box>
      <Typography variant="body2" sx={{ fontWeight: 800, color, fontFamily: 'monospace' }}>
        {value}
      </Typography>
    </Box>
  )
}

function GaugeBar({
  value,
  max,
  color,
  label,
}: {
  value: number
  max: number
  color: string
  label: string
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const barColor = pct >= 80 ? '#f87171' : pct >= 60 ? '#fbbf24' : color
  return (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 800, color: barColor }}>
          {pct.toFixed(1)}%
        </Typography>
      </Box>
      <Box sx={{ height: 7, bgcolor: 'action.hover', borderRadius: 1, overflow: 'hidden' }}>
        <Box
          sx={{
            height: '100%',
            width: `${pct}%`,
            bgcolor: barColor,
            borderRadius: 1,
            transition: 'width 0.4s ease',
          }}
        />
      </Box>
    </Box>
  )
}

const tooltipStyle = (theme: Theme) => ({
  contentStyle: {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    fontSize: 12,
  },
})

export default function InfraTab({ envFilter }: Props) {
  const theme = useTheme()

  const { data: containerMetrics = [], isLoading: isContainerLoading } = useQuery({
    queryKey: ['container-metrics'],
    queryFn: getContainerMetrics,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnMount: 'always',
  })
  const { data: hostMetrics = [], isLoading: isHostLoading } = useQuery({
    queryKey: ['host-metrics'],
    queryFn: getHostMetrics,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnMount: 'always',
  })
  const { data: jvmMetrics = [], isLoading: isJvmLoading } = useQuery({
    queryKey: ['jvm-metrics'],
    queryFn: getJvmMetrics,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnMount: 'always',
  })

  const containerCpuSeries = filterSeries(
    containerMetrics,
    'app_container_cpu_utilization_avg_5m',
    envFilter
  )
  const containerMemSeries = filterSeries(
    containerMetrics,
    'app_container_memory_utilization_avg_5m',
    envFilter
  )
  const containerServices = [
    ...new Set([...containerCpuSeries, ...containerMemSeries].map(s => s.service).filter(Boolean)),
  ] as string[]

  const hostMemSeries = filterSeries(hostMetrics, 'host_memory_usage_avg_5m', envFilter)
  const hostNetRxSeries = filterSeries(hostMetrics, 'host_network_rx_bytes_5m', envFilter)
  const hostNetTxSeries = filterSeries(hostMetrics, 'host_network_tx_bytes_5m', envFilter)
  const hostInstances = [
    ...new Set(
      [...hostMemSeries, ...hostNetRxSeries, ...hostNetTxSeries].map(getHostKey).filter(Boolean)
    ),
  ] as string[]

  const jvmCpuSeries = filterJvmSeries(jvmMetrics, 'app_jvm_cpu_utilization_pct_avg_5m', envFilter)
  const jvmMemSeries = filterJvmSeries(jvmMetrics, 'app_jvm_memory_used_avg_5m', envFilter)
  const jvmGcCountSeries = filterJvmSeries(jvmMetrics, 'app_jvm_gc_count_5m', envFilter)
  const jvmGcDurSeries = filterJvmSeries(jvmMetrics, 'app_jvm_gc_duration_p95_5m', envFilter)
  const jvmServices = [
    ...new Set(
      [...jvmCpuSeries, ...jvmMemSeries, ...jvmGcCountSeries, ...jvmGcDurSeries]
        .map(s => s.service)
        .filter(Boolean)
    ),
  ] as string[]

  // ── Container 차트 데이터
  const containerTimes = buildTimes(containerCpuSeries)
  const containerChartData = useMemo(
    () =>
      containerTimes.map(ts => {
        const row: Record<string, number | string | null> = { time: toTime(ts) }
        containerServices.forEach(svc => {
          row[`${svc}_cpu`] =
            containerCpuSeries.find(s => s.service === svc)?.points.find(p => p.ts === ts)?.value ??
            null
          row[`${svc}_mem`] =
            containerMemSeries.find(s => s.service === svc)?.points.find(p => p.ts === ts)?.value ??
            null
        })
        return row
      }),
    [containerTimes.join(',')]
  )

  // ── Host 네트워크 차트 데이터
  const hostTimes = buildTimes([...hostNetRxSeries, ...hostNetTxSeries])
  const hostNetChartData = useMemo(
    () =>
      hostTimes.map(ts => {
        const row: Record<string, number | string | null> = { time: toTime(ts) }
        hostInstances.forEach(host => {
          row[`${host}_rx`] =
            hostNetRxSeries.find(s => getHostKey(s) === host)?.points.find(p => p.ts === ts)
              ?.value ?? null
          row[`${host}_tx`] =
            hostNetTxSeries.find(s => getHostKey(s) === host)?.points.find(p => p.ts === ts)
              ?.value ?? null
        })
        return row
      }),
    [hostTimes.join(',')]
  )

  // ── JVM GC 바 차트 데이터 (서비스별 최신값)
  const jvmBarData = jvmServices.map(svc => ({
    svc,
    gcCount: getSeriesLast(jvmGcCountSeries.find(s => s.service === svc)),
    gcDur: getSeriesLast(jvmGcDurSeries.find(s => s.service === svc)),
  }))

  // ── JVM CPU/MEM 추이 차트
  const jvmTimes = buildTimes(jvmCpuSeries)
  const jvmChartData = useMemo(
    () =>
      jvmTimes.map(ts => {
        const row: Record<string, number | string | null> = { time: toTime(ts) }
        jvmServices.forEach(svc => {
          row[`${svc}_cpu`] =
            jvmCpuSeries.find(s => s.service === svc)?.points.find(p => p.ts === ts)?.value ?? null
          row[`${svc}_mem`] =
            (jvmMemSeries.find(s => s.service === svc)?.points.find(p => p.ts === ts)?.value ?? 0) /
            BYTES_PER_MB
        })
        return row
      }),
    [jvmTimes.join(',')]
  )

  if (isContainerLoading || isHostLoading || isJvmLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[260, 260, 260].map((h, i) => (
          <Paper
            key={i}
            variant="outlined"
            sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}
          >
            <Skeleton variant="rounded" height={h} />
          </Paper>
        ))}
      </Box>
    )
  }

  if (containerServices.length === 0 && hostInstances.length === 0 && jvmServices.length === 0) {
    return <NoDataState title="No Infra data" description="No infrastructure metrics available." />
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* ── Container ── */}
      {containerServices.length > 0 && (
        <Paper
          variant="outlined"
          sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}
        >
          <SectionLabel>Container</SectionLabel>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch' }}>
            {/* CPU 추이 멀티라인 */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1 }}
              >
                CPU Utilization Trend
              </Typography>
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={containerChartData}
                    margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                  >
                    <defs>
                      {containerServices.map((svc, i) => (
                        <linearGradient key={svc} id={`cnt-cpu-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={SVC_COLORS[i]} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={SVC_COLORS[i]} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid
                      stroke={theme.palette.divider}
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={30}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                      tickLine={false}
                      axisLine={false}
                      width={36}
                      tickFormatter={v => `${v}%`}
                    />
                    <ReferenceLine
                      y={80}
                      stroke="#f87171"
                      strokeDasharray="4 4"
                      strokeWidth={1}
                      label={{
                        value: '80%',
                        position: 'insideTopRight',
                        fontSize: 9,
                        fill: '#f87171',
                      }}
                    />
                    <Tooltip
                      {...tooltipStyle(theme)}
                      formatter={v => [`${Number(v).toFixed(2)}%`]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {containerServices.map((svc, i) => (
                      <Area
                        key={svc}
                        type="monotone"
                        dataKey={`${svc}_cpu`}
                        name={svc}
                        stroke={SVC_COLORS[i]}
                        fill={`url(#cnt-cpu-${i})`}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                        connectNulls
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Box>

            {/* 현재값 게이지 + 스탯 */}
            <Box
              sx={{
                flex: '0 0 220px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              {containerServices.map((svc, i) => {
                const cpuVal = getSeriesLast(containerCpuSeries.find(s => s.service === svc))
                const memVal = getSeriesLast(containerMemSeries.find(s => s.service === svc))
                return (
                  <Box key={svc} sx={{ mb: 1.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: SVC_COLORS[i],
                        letterSpacing: 0.5,
                        display: 'block',
                        mb: 0.5,
                      }}
                    >
                      {svc.toUpperCase()}
                    </Typography>
                    <GaugeBar value={cpuVal} max={100} color={SVC_COLORS[i]} label="CPU" />
                    <GaugeBar
                      value={memVal}
                      max={100}
                      color={SVC_COLORS[(i + 2) % SVC_COLORS.length]}
                      label="Memory"
                    />
                  </Box>
                )
              })}
            </Box>
          </Box>
        </Paper>
      )}

      {/* ── Host ── */}
      {hostInstances.length > 0 && (
        <Paper
          variant="outlined"
          sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}
        >
          <SectionLabel>Host</SectionLabel>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch' }}>
            {/* 네트워크 RX/TX 추이 */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1 }}
              >
                Network I/O Trend
              </Typography>
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={hostNetChartData}
                    margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="host-rx" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="host-tx" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke={theme.palette.divider}
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={30}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                      tickLine={false}
                      axisLine={false}
                      width={52}
                      tickFormatter={v => formatBytes(v)}
                    />
                    <Tooltip {...tooltipStyle(theme)} formatter={v => [formatBytes(Number(v))]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {hostInstances.map(host => (
                      <Fragment key={host}>
                        <Area
                          type="monotone"
                          dataKey={`${host}_rx`}
                          name={`${host} RX`}
                          stroke="#60a5fa"
                          fill="url(#host-rx)"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                          connectNulls
                        />
                        <Area
                          type="monotone"
                          dataKey={`${host}_tx`}
                          name={`${host} TX`}
                          stroke="#f87171"
                          fill="url(#host-tx)"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                          connectNulls
                        />
                      </Fragment>
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Box>

            {/* 현재값 스탯 */}
            <Box
              sx={{
                flex: '0 0 220px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              {hostInstances.map(host => {
                const mem = hostMemSeries.find(s => getHostKey(s) === host)
                const rx = hostNetRxSeries.find(s => getHostKey(s) === host)
                const tx = hostNetTxSeries.find(s => getHostKey(s) === host)
                return (
                  <Box key={host} sx={{ mb: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: '#94a3b8',
                        letterSpacing: 0.5,
                        display: 'block',
                        mb: 0.5,
                      }}
                    >
                      {host.toUpperCase()}
                    </Typography>
                    {mem && (
                      <StatRow
                        label="Memory"
                        value={formatBytes(getSeriesLast(mem))}
                        color="#a78bfa"
                      />
                    )}
                    {rx && (
                      <StatRow
                        label="Network RX"
                        value={formatBytes(getSeriesLast(rx))}
                        color="#60a5fa"
                        sub="5m avg"
                      />
                    )}
                    {tx && (
                      <StatRow
                        label="Network TX"
                        value={formatBytes(getSeriesLast(tx))}
                        color="#f87171"
                        sub="5m avg"
                      />
                    )}
                  </Box>
                )
              })}
            </Box>
          </Box>
        </Paper>
      )}

      {/* ── JVM ── */}
      {jvmServices.length > 0 && (
        <Paper
          variant="outlined"
          sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}
        >
          <SectionLabel>JVM</SectionLabel>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch' }}>
            {/* CPU/MEM 추이 이중 Y축 */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1 }}
              >
                CPU & Heap Memory Trend
              </Typography>
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={jvmChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid
                      stroke={theme.palette.divider}
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={30}
                    />
                    <YAxis
                      yAxisId="cpu"
                      tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                      tickLine={false}
                      axisLine={false}
                      width={36}
                      tickFormatter={v => `${v}%`}
                    />
                    <YAxis
                      yAxisId="mem"
                      orientation="right"
                      tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                      tickLine={false}
                      axisLine={false}
                      width={44}
                      tickFormatter={v => `${v}MB`}
                    />
                    <Tooltip {...tooltipStyle(theme)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {jvmServices.map((svc, i) => (
                      <Fragment key={svc}>
                        <Line
                          yAxisId="cpu"
                          type="monotone"
                          dataKey={`${svc}_cpu`}
                          name={`${svc} CPU`}
                          stroke={SVC_COLORS[i]}
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                          connectNulls
                        />
                        <Line
                          yAxisId="mem"
                          type="monotone"
                          dataKey={`${svc}_mem`}
                          name={`${svc} Heap`}
                          stroke={SVC_COLORS[i]}
                          strokeWidth={1.5}
                          strokeDasharray="4 3"
                          dot={false}
                          isAnimationActive={false}
                          connectNulls
                        />
                      </Fragment>
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Box>

            {/* GC 바 차트 */}
            <Box sx={{ flex: '0 0 240px', minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1 }}
              >
                GC Activity (5m)
              </Typography>
              <Box sx={{ height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={jvmBarData}
                    margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                    barCategoryGap="30%"
                  >
                    <CartesianGrid
                      stroke={theme.palette.divider}
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="svc"
                      tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="count"
                      tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                      tickLine={false}
                      axisLine={false}
                      width={28}
                    />
                    <YAxis
                      yAxisId="dur"
                      orientation="right"
                      tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                      tickLine={false}
                      axisLine={false}
                      width={36}
                      tickFormatter={v => `${v}ms`}
                    />
                    <Tooltip {...tooltipStyle(theme)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar
                      yAxisId="count"
                      dataKey="gcCount"
                      name="GC Count"
                      fill="#a78bfa"
                      radius={[3, 3, 0, 0]}
                      isAnimationActive={false}
                    />
                    <Bar
                      yAxisId="dur"
                      dataKey="gcDur"
                      name="GC p95 (ms)"
                      fill="#f87171"
                      radius={[3, 3, 0, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
              {/* JVM 현재값 스탯 */}
              <Box sx={{ mt: 1 }}>
                {jvmServices.map((svc, i) => (
                  <Box key={svc} sx={{ mb: 0.5 }}>
                    <StatRow
                      label={svc}
                      value={`${getSeriesLast(jvmCpuSeries.find(s => s.service === svc)).toFixed(1)}% · ${(getSeriesLast(jvmMemSeries.find(s => s.service === svc)) / BYTES_PER_MB).toFixed(0)} MB`}
                      color={SVC_COLORS[i]}
                      sub="CPU · Heap"
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  )
}
