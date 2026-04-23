'use client'

import { useMemo, useState } from 'react'
import { Box, Paper, Typography, useTheme } from '@mui/material'
import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import type { Trace } from '@/lib/types'
import LiveButton from '@/components/logs/LogFilters/LiveButton'

interface Props {
  traces: Trace[]
  isLiveEnabled: boolean
  streamStatus: 'connecting' | 'live' | 'reconnecting' | 'offline'
  onLiveChange: (v: boolean) => void
  onSelectTrace: (id: string | null) => void
  selectedTraceId: string | null
}

const formatDuration = (v: number) => `${(v / 1000).toFixed(3)}s`
const formatTime = (v: number) => {
  const d = new Date(v)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function TracesScatterChart({
  traces,
  isLiveEnabled,
  streamStatus,
  onLiveChange,
  onSelectTrace,
  selectedTraceId,
}: Props) {
  const theme = useTheme()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const chartNow = Math.ceil(Date.now() / 60000) * 60000
  const xDomain: [number, number] = [chartNow - 10 * 60 * 1000, chartNow]
  const xTicks = Array.from({ length: 11 }, (_, i) => chartNow - 10 * 60 * 1000 + i * 60 * 1000)

  const minDuration = traces.length > 0 ? Math.min(...traces.map(t => t.duration)) : 0
  const maxDuration = traces.length > 0 ? Math.max(...traces.map(t => t.duration)) : 10000
  const durationRange = Math.max(maxDuration - minDuration, 1)

  const chartMaxDuration = Math.max(
    traces.filter(t => t.startTime >= xDomain[0]).reduce((m, t) => Math.max(m, t.duration), 0),
    10000
  )
  const yDomain: [number, number] = [0, chartMaxDuration]

  const getColor = (t: Trace) => {
    if (t.status === 'error') return '#f87171'
    if (t.status === 'slow') return '#fbbf24'
    return '#60a5fa'
  }

  const chartData = useMemo(() => {
    return traces
      .filter(t => t.startTime >= xDomain[0] && t.startTime <= xDomain[1])
      .map(t => {
        const normalized = (t.duration - minDuration) / durationRange
        return {
          id: t.id,
          service: t.service,
          operation: t.operation,
          startTime: t.startTime,
          duration: t.duration,
          size: 40 + normalized * 200,
          spanCount: t.spans.length,
          errorSpanCount: t.spans.filter(s => s.status === 'error').length,
          statusCode: t.status_code,
          color: getColor(t),
        }
      })
  }, [traces, xDomain[0]])

  return (
    <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Trace Timeline
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Duration vs Time · last 10 minutes
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {selectedTraceId && (
            <Typography
              variant="caption"
              onClick={() => onSelectTrace(null)}
              sx={{
                color: '#818cf8',
                cursor: 'pointer',
                fontWeight: 600,
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Clear selection
            </Typography>
          )}
          <LiveButton
            value={isLiveEnabled}
            isStreaming={streamStatus === 'live'}
            onChange={onLiveChange}
          />
        </Box>
      </Box>

      <Box sx={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
            onMouseLeave={() => setHoveredId(null)}
          >
            <CartesianGrid stroke={theme.palette.divider} strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="startTime"
              domain={xDomain}
              ticks={xTicks}
              tickFormatter={formatTime}
              tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: theme.palette.divider }}
              minTickGap={24}
            />
            <YAxis
              type="number"
              dataKey="duration"
              domain={yDomain}
              tickFormatter={formatDuration}
              tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: theme.palette.divider }}
              width={52}
            />
            <ZAxis type="number" dataKey="size" range={[30, 260]} />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8,
                fontSize: 12,
              }}
              content={({ active, payload }) => {
                const item = (payload as any)?.[0]?.payload
                if (!active || !item) return null
                return (
                  <Box
                    sx={{
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 1.25,
                      minWidth: 200,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}
                    >
                      {item.service}: {item.operation}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        display: 'block',
                        fontFamily: 'monospace',
                        fontSize: 10,
                        mb: 0.5,
                      }}
                    >
                      {item.id}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Duration:{' '}
                        <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>
                          {formatDuration(item.duration)}
                        </Box>
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Spans:{' '}
                        <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>
                          {item.spanCount}
                        </Box>{' '}
                        ({item.errorSpanCount} errors)
                      </Typography>
                      {item.statusCode && (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          HTTP:{' '}
                          <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>
                            {item.statusCode}
                          </Box>
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )
              }}
            />
            <Scatter
              data={chartData}
              isAnimationActive={false}
              onMouseEnter={(p: any) => setHoveredId(p?.id ?? null)}
              onClick={(p: any) => {
                if (p?.id) onSelectTrace(selectedTraceId === p.id ? null : p.id)
              }}
            >
              {chartData.map(p => {
                const isSelected = selectedTraceId === p.id
                const isHovered = hoveredId === p.id
                const isDimmed = selectedTraceId !== null && !isSelected
                return (
                  <Cell
                    key={p.id}
                    fill={p.color}
                    fillOpacity={isDimmed ? 0.2 : isHovered || isSelected ? 1 : 0.8}
                    stroke={isSelected ? '#ffffff' : p.color}
                    strokeWidth={isSelected ? 2 : 0.5}
                    style={{ cursor: 'pointer' }}
                  />
                )
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </Box>

      {/* 범례 */}
      <Box sx={{ display: 'flex', gap: 2, mt: 1, justifyContent: 'center' }}>
        {[
          { label: 'OK', color: '#60a5fa' },
          { label: 'Error', color: '#f87171' },
          { label: 'Slow', color: '#fbbf24' },
        ].map(item => (
          <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color }} />
            <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary' }}>
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  )
}
