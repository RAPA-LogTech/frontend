'use client'

import { Box, Paper, Stack, Typography, useTheme } from '@mui/material'
import type { MetricSeries } from '@/lib/types'
import NoDataState from '@/components/common/NoDataState'
import { getSeriesLast, sliceLast5Min } from '../metricsUtils'
import { MiniSparkline, SectionLabel } from '../MetricsShared'

interface Props {
  metricSeries: MetricSeries[]
  envFilter: string
}

function filterSeries(series: MetricSeries[], name: string, envFilter: string) {
  return series.filter(s => {
    if (!s.name.includes(name)) return false
    if (envFilter === 'all') return true
    const env = (s as MetricSeries & { env?: string }).env
    return env ? env === envFilter : false
  })
}

function MetricCard({ series, label, unit, color }: { series?: MetricSeries; label: string; unit: string; color: string }) {
  const val = getSeriesLast(series)
  return (
    <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 1 }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1, display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 700, color }}>
        {val.toFixed(2)}{unit}
      </Typography>
      {series && <MiniSparkline series={{ ...series, points: sliceLast5Min(series.points) }} color={color} />}
    </Paper>
  )
}

export default function JvmTab({ metricSeries, envFilter }: Props) {
  const theme = useTheme()

  // 메트릭 이름을 정확히 지정
  const jvmCpuSeries = filterSeries(metricSeries, 'app_jvm_cpu_utilization_pct_avg_5m', envFilter)
  const jvmMemSeries = filterSeries(metricSeries, 'app_jvm_memory_used_avg_5m', envFilter)
  const jvmGcCountSeries = filterSeries(metricSeries, 'app_jvm_gc_count_5m', envFilter)
  const jvmGcDurSeries = filterSeries(metricSeries, 'app_jvm_gc_duration_p95_5m', envFilter)

  const services = [...new Set([
    ...jvmCpuSeries,
    ...jvmMemSeries,
    ...jvmGcCountSeries,
    ...jvmGcDurSeries
  ].map(s => s.service).filter(Boolean))] as string[]

  if (services.length === 0) {
    return <NoDataState title="No JVM data" description="No JVM metrics available." />
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {services.map(svc => {
        const cpu = jvmCpuSeries.find(s => s.service === svc)
        const mem = jvmMemSeries.find(s => s.service === svc)
        const gcCount = jvmGcCountSeries.find(s => s.service === svc)
        const gcDur = jvmGcDurSeries.find(s => s.service === svc)
        return (
          <Paper key={svc} variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <SectionLabel>{svc.toUpperCase()}</SectionLabel>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              {cpu && <Box sx={{ flex: '1 1 180px', minWidth: 0 }}><MetricCard series={cpu} label="JVM CPU(5m avg)" unit="%" color={theme.palette.warning.main} /></Box>}
              {mem && <Box sx={{ flex: '1 1 180px', minWidth: 0 }}><MetricCard series={mem} label="JVM Memory(5m avg)" unit="MB" color={theme.palette.info.main} /></Box>}
              {gcCount && <Box sx={{ flex: '1 1 180px', minWidth: 0 }}><MetricCard series={gcCount} label="GC Count(5m)" unit="회" color={theme.palette.secondary.main} /></Box>}
              {gcDur && <Box sx={{ flex: '1 1 180px', minWidth: 0 }}><MetricCard series={gcDur} label="GC Duration p95(5m)" unit="ms" color={theme.palette.error.main} /></Box>}
            </Box>
          </Paper>
        )
      })}
    </Box>
  )
}
