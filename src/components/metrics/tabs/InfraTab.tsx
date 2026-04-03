'use client'

import { useQuery } from '@tanstack/react-query'
import { Box, Paper, Skeleton, Stack, Typography, useTheme } from '@mui/material'
import type { MetricSeries } from '@/lib/types'
import { getContainerMetrics, getHostMetrics } from '@/lib/apiClient'
import NoDataState from '@/components/common/NoDataState'
import { getSeriesLast, sliceLast5Min, filterByEnv } from '../metricsUtils'
import { MiniSparkline, SectionLabel } from '../MetricsShared'




interface Props {
  envFilter: string;
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const normalized = value / (1024 ** exponent);
  const digits = normalized >= 100 ? 0 : normalized >= 10 ? 1 : 2;
  return `${normalized.toFixed(digits)} ${units[exponent]}`;
}

function getHostKey(series: MetricSeries) {
  return series.instance || series.service || 'unknown-host';
}

function filterSeries(series: MetricSeries[], name: string, envFilter: string) {
  return series.filter(s => {
    if (!s.name.includes(name)) return false;
    return filterByEnv(s, envFilter);
  });
}

export default function InfraTab({ envFilter }: Props) {
  const theme = useTheme();

  const {
    data: containerMetrics = [],
    isLoading: isContainerLoading,
    isFetching: isContainerFetching,
  } = useQuery({
    queryKey: ['container-metrics'],
    queryFn: getContainerMetrics,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnMount: 'always',
  })

  const {
    data: hostMetrics = [],
    isLoading: isHostLoading,
    isFetching: isHostFetching,
  } = useQuery({
    queryKey: ['host-metrics'],
    queryFn: getHostMetrics,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnMount: 'always',
  })

  // 서비스별 컨테이너 CPU/MEM
  const containerCpuSeries = filterSeries(containerMetrics, 'app_container_cpu_utilization_avg_5m', envFilter);
  const containerMemSeries = filterSeries(containerMetrics, 'app_container_memory_utilization_avg_5m', envFilter);
  const containerServices = [...new Set([...containerCpuSeries, ...containerMemSeries].map(s => s.service).filter(Boolean))] as string[];

  // Host metrics
  const hostMemSeries = filterSeries(hostMetrics, 'host_memory_usage_avg_5m', envFilter);
  const hostNetRxSeries = filterSeries(hostMetrics, 'host_network_rx_bytes_5m', envFilter);
  const hostNetTxSeries = filterSeries(hostMetrics, 'host_network_tx_bytes_5m', envFilter);
  const hostInstances = [...new Set([
    ...hostMemSeries,
    ...hostNetRxSeries,
    ...hostNetTxSeries
  ].map(getHostKey).filter(Boolean))] as string[];

  if (isContainerLoading || isHostLoading || isContainerFetching || isHostFetching) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Skeleton variant="text" width={180} height={24} />
          <Skeleton variant="rounded" height={180} sx={{ mt: 1 }} />
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Skeleton variant="text" width={140} height={24} />
          <Skeleton variant="rounded" height={180} sx={{ mt: 1 }} />
        </Paper>
      </Box>
    );
  }

  if (containerServices.length === 0 && hostInstances.length === 0) {
    return <NoDataState title="No Infra data" description="No infrastructure metrics available." />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 서비스별 컨테이너 CPU/MEM */}
      {containerServices.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <SectionLabel>서비스별 컨테이너 cpu, mem</SectionLabel>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {containerServices.map(svc => {
              const cpu = containerCpuSeries.find(s => s.service === svc);
              const mem = containerMemSeries.find(s => s.service === svc);
              return (
                <Box key={svc} sx={{ flex: '1 1 220px', minWidth: 0, maxWidth: 300 }}>
                  <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1, display: 'block', mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {svc?.toUpperCase()}
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>{getSeriesLast(cpu).toFixed(2)}%</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>컨테이너 CPU 사용률 (최근 5분 평균)</Typography>
                        {cpu && <MiniSparkline series={{ ...cpu, points: sliceLast5Min(cpu.points) }} color={theme.palette.success.main} />}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>{getSeriesLast(mem).toFixed(2)}%</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>컨테이너 메모리 사용률 (최근 5분 평균)</Typography>
                        {mem && <MiniSparkline series={{ ...mem, points: sliceLast5Min(mem.points) }} color={theme.palette.secondary.main} />}
                      </Box>
                    </Stack>
                  </Paper>
                </Box>
              );
            })}
          </Box>
        </Paper>
      )}

      {/* Host metrics */}
      {hostInstances.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <SectionLabel>Host metrics</SectionLabel>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {hostInstances.map(host => {
              const mem = hostMemSeries.find(s => getHostKey(s) === host);
              const rx = hostNetRxSeries.find(s => getHostKey(s) === host);
              const tx = hostNetTxSeries.find(s => getHostKey(s) === host);
              return (
                <Box key={host} sx={{ flex: '1 1 220px', minWidth: 0, maxWidth: 300 }}>
                  <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1, display: 'block', mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {host}
                    </Typography>
                    <Stack spacing={1}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>호스트 메모리 사용량 (최근 5분 평균)</Typography>
                        <Typography variant="h5" sx={{ color: theme.palette.secondary.main }}>{formatBytes(getSeriesLast(mem))}</Typography>
                        {mem && <MiniSparkline series={{ ...mem, points: sliceLast5Min(mem.points) }} color={theme.palette.secondary.main} />}
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>호스트 네트워크 수신량 (최근 5분)</Typography>
                        <Typography variant="h6" sx={{ color: theme.palette.info.main }}>{formatBytes(getSeriesLast(rx))}</Typography>
                        {rx && <MiniSparkline series={{ ...rx, points: sliceLast5Min(rx.points) }} color={theme.palette.info.main} />}
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>호스트 네트워크 송신량 (최근 5분)</Typography>
                        <Typography variant="h6" sx={{ color: theme.palette.info.dark }}>{formatBytes(getSeriesLast(tx))}</Typography>
                        {tx && <MiniSparkline series={{ ...tx, points: sliceLast5Min(tx.points) }} color={theme.palette.info.dark} />}
                      </Box>
                    </Stack>
                  </Paper>
                </Box>
              );
            })}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
