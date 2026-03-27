'use client'

import { Box, Paper, Typography, useTheme } from '@mui/material'
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
        {val.toFixed(1)}{unit}
      </Typography>
      {series && <MiniSparkline series={{ ...series, points: sliceLast5Min(series.points) }} color={color} />}
    </Paper>
  )
}

export default function DatabaseTab({ metricSeries, envFilter }: Props) {
  const theme = useTheme()

  const usageSeries = filterSeries(metricSeries, 'db_connection_use', envFilter)
  const waitSeries = filterSeries(metricSeries, 'db_connection_wait', envFilter)

  const services = [...new Set([...usageSeries, ...waitSeries].map(s => s.service).filter(Boolean))] as string[]

  if (services.length === 0) {
    return <NoDataState title="No Database data" description="No DB connection metrics available." />
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {services.map(svc => {
        const use = usageSeries.find(s => s.service === svc)
        const wait = waitSeries.find(s => s.service === svc)
        return (
          <Paper key={svc} variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <SectionLabel>{svc.toUpperCase()}</SectionLabel>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              {use && <Box sx={{ flex: '1 1 200px', minWidth: 0 }}><MetricCard series={use} label="Connection Use p95" unit="ms" color={theme.palette.info.main} /></Box>}
              {wait && <Box sx={{ flex: '1 1 200px', minWidth: 0 }}><MetricCard series={wait} label="Connection Wait p95" unit="ms" color={theme.palette.warning.main} /></Box>}
            </Box>
          </Paper>
        )
      })}
    </Box>
  )
}
