'use client'

import { Box, Paper, Stack, Typography, useTheme } from '@mui/material'
import type { MetricSeries } from '@/lib/types'
import NoDataState from '@/components/common/NoDataState'
import { getSeriesLast, sliceLast5Min, filterByEnv } from '../metricsUtils'
import { MiniSparkline, SectionLabel } from '../MetricsShared'



interface Props {
  metricSeries: MetricSeries[];
  serviceHealth: any[];
  envFilter: string;
}

function filterSeries(series: MetricSeries[], name: string, envFilter: string) {
  return series.filter(s => {
    if (!s.name.includes(name)) return false;
    return filterByEnv(s, envFilter);
  });
}

export default function InfraTab({ metricSeries, serviceHealth, envFilter }: Props) {
  const theme = useTheme();

  // 서비스별 컨테이너 CPU/MEM
  const containerCpuSeries = filterSeries(metricSeries, 'app_container_cpu_utilization_avg_5m', envFilter);
  const containerMemSeries = filterSeries(metricSeries, 'app_container_memory_utilization_avg_5m', envFilter);
  const containerServices = [...new Set([...containerCpuSeries, ...containerMemSeries].map(s => s.service).filter(Boolean))] as string[];

  // Host metrics
  const hostMemSeries = filterSeries(metricSeries, 'host_memory_usage_avg_5m', envFilter);
  const hostNetRxSeries = filterSeries(metricSeries, 'host_network_rx_bytes_5m', envFilter);
  const hostNetTxSeries = filterSeries(metricSeries, 'host_network_tx_bytes_5m', envFilter);
  const hostInstances = [...new Set([
    ...hostMemSeries,
    ...hostNetRxSeries,
    ...hostNetTxSeries
  ].map(s => s.instance).filter(Boolean))] as string[];

  if (containerServices.length === 0 && hostInstances.length === 0) {
    return <NoDataState title="No Infra data" description="No infrastructure metrics available." />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 서비스별 컨테이너 CPU/MEM */}
      {containerServices.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <SectionLabel>서비스별 컨테이너 CPU/MEM</SectionLabel>
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
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>CPU avg</Typography>
                        {cpu && <MiniSparkline series={{ ...cpu, points: sliceLast5Min(cpu.points) }} color={theme.palette.success.main} />}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>{getSeriesLast(mem).toFixed(2)}%</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>MEM avg</Typography>
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
              const mem = hostMemSeries.find(s => s.instance === host);
              const rx = hostNetRxSeries.find(s => s.instance === host);
              const tx = hostNetTxSeries.find(s => s.instance === host);
              return (
                <Box key={host} sx={{ flex: '1 1 220px', minWidth: 0, maxWidth: 300 }}>
                  <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1, display: 'block', mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {host}
                    </Typography>
                    <Stack spacing={1}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>Memory</Typography>
                        <Typography variant="h5" sx={{ color: theme.palette.secondary.main }}>{getSeriesLast(mem).toFixed(2)}%</Typography>
                        {mem && <MiniSparkline series={{ ...mem, points: sliceLast5Min(mem.points) }} color={theme.palette.secondary.main} />}
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>Network RX</Typography>
                        <Typography variant="h6" sx={{ color: theme.palette.info.main }}>{getSeriesLast(rx).toFixed(0)} bytes</Typography>
                        {rx && <MiniSparkline series={{ ...rx, points: sliceLast5Min(rx.points) }} color={theme.palette.info.main} />}
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>Network TX</Typography>
                        <Typography variant="h6" sx={{ color: theme.palette.info.dark }}>{getSeriesLast(tx).toFixed(0)} bytes</Typography>
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
