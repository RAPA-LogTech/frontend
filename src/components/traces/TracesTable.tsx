'use client'

import { memo } from 'react'
import Link from 'next/link'
import { Box, Chip, Typography } from '@mui/material'
import type { Trace } from '@/lib/types'
import { formatTimestamp } from '@/lib/formatters'

interface Props {
  traces: Trace[]
  selectedTraceId: string | null
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  ok: { color: '#4ade80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.3)' },
  error: { color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
  slow: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' },
}

function DurationBar({ duration, maxDuration }: { duration: number; maxDuration: number }) {
  const pct = maxDuration > 0 ? Math.min((duration / maxDuration) * 100, 100) : 0
  const color = duration / 1000 >= 2 ? '#f87171' : duration / 1000 >= 1 ? '#fbbf24' : '#60a5fa'
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
      <Typography
        variant="caption"
        sx={{
          fontFamily: 'monospace',
          fontWeight: 700,
          color,
          fontSize: 11,
          whiteSpace: 'nowrap',
          width: 56,
          textAlign: 'right',
          flexShrink: 0,
        }}
      >
        {(duration / 1000).toFixed(3)}s
      </Typography>
      <Box
        sx={{
          flex: 1,
          height: 4,
          bgcolor: 'action.hover',
          borderRadius: 1,
          overflow: 'hidden',
          minWidth: 40,
        }}
      >
        <Box
          sx={{
            height: '100%',
            width: `${pct}%`,
            bgcolor: color,
            borderRadius: 1,
            transition: 'width 0.3s ease',
          }}
        />
      </Box>
    </Box>
  )
}

function TraceRow({
  trace,
  maxDuration,
  isSelected,
}: {
  trace: Trace
  maxDuration: number
  isSelected: boolean
}) {
  const statusCfg = STATUS_CONFIG[trace.status] ?? STATUS_CONFIG.ok
  const errorSpans = trace.spans.filter(s => s.status === 'error').length
  const services = [...new Set(trace.spans.map(s => s.service))].slice(0, 3)

  return (
    <Box
      component={Link}
      href={`/traces/${trace.id}`}
      sx={{
        display: 'grid',
        gridTemplateColumns: '148px 110px 90px 60px 80px 1fr 180px',
        alignItems: 'center',
        px: 1.5,
        py: 0.75,
        borderBottom: '1px solid',
        borderColor: 'divider',
        borderLeft: `3px solid ${trace.status === 'error' ? '#f87171' : trace.status === 'slow' ? '#fbbf24' : 'transparent'}`,
        textDecoration: 'none',
        bgcolor: isSelected ? 'rgba(99,102,241,0.06)' : 'transparent',
        transition: 'background 0.1s',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      {/* Timestamp */}
      <Typography
        variant="caption"
        sx={{
          fontFamily: 'monospace',
          color: 'text.secondary',
          fontSize: 11,
          whiteSpace: 'nowrap',
        }}
      >
        {formatTimestamp(trace.startTime)}
      </Typography>

      {/* Service */}
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          color: 'text.primary',
          fontSize: 11,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          pr: 1,
        }}
      >
        {trace.service}
      </Typography>

      {/* Operation */}
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          fontSize: 11,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          pr: 1,
        }}
      >
        {trace.operation}
      </Typography>

      {/* Status */}
      <Box>
        <Chip
          label={trace.status}
          size="small"
          sx={{
            height: 18,
            fontSize: 10,
            fontWeight: 700,
            bgcolor: statusCfg.bg,
            color: statusCfg.color,
            border: `1px solid ${statusCfg.border}`,
            '& .MuiChip-label': { px: 0.75 },
          }}
        />
      </Box>

      {/* Spans */}
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', fontSize: 11, textAlign: 'center' }}
      >
        {trace.spans.length} spans
        {errorSpans > 0 && (
          <Box component="span" sx={{ color: '#f87171', ml: 0.5 }}>
            ({errorSpans}✕)
          </Box>
        )}
      </Typography>

      {/* Duration bar */}
      <DurationBar duration={trace.duration} maxDuration={maxDuration} />

      {/* Services */}
      <Box
        sx={{
          display: 'flex',
          gap: 0.5,
          justifyContent: 'flex-end',
          flexWrap: 'nowrap',
          overflow: 'hidden',
        }}
      >
        {services.map(svc => (
          <Chip
            key={svc}
            label={svc}
            size="small"
            variant="outlined"
            sx={{ height: 16, fontSize: 9, '& .MuiChip-label': { px: 0.5 } }}
          />
        ))}
      </Box>
    </Box>
  )
}

function TracesTableComponent({ traces, selectedTraceId }: Props) {
  const maxDuration = Math.max(...traces.map(t => t.duration), 1)

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'visible',
        bgcolor: 'background.default',
      }}
    >
      {/* 헤더 */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '148px 110px 90px 60px 80px 1fr 180px',
          px: 1.5,
          py: 0.75,
          borderBottom: '2px solid',
          borderColor: 'divider',
          bgcolor: 'action.hover',
          borderLeft: '3px solid transparent',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
      >
        {['TIMESTAMP', 'SERVICE', 'OPERATION', 'STATUS', 'SPANS', 'DURATION', 'SERVICES'].map(h => (
          <Typography
            key={h}
            variant="caption"
            sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 10, letterSpacing: 0.5 }}
          >
            {h}
          </Typography>
        ))}
      </Box>

      {traces.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            No traces match the current filters
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
            Try adjusting or clearing the filters above
          </Typography>
        </Box>
      ) : (
        traces.map(trace => (
          <TraceRow
            key={trace.id}
            trace={trace}
            maxDuration={maxDuration}
            isSelected={selectedTraceId === trace.id}
          />
        ))
      )}
    </Box>
  )
}

const TracesTable = memo(TracesTableComponent)
export default TracesTable
