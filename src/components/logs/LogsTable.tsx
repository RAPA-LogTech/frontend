'use client'

import { memo } from 'react'
import { Box, Chip, Typography } from '@mui/material'
import type { LogEntry } from '@/lib/types'
import { formatDateTime } from '@/lib/formatters'

type LogsTableProps = {
  logs: LogEntry[]
  onSelect: (log: LogEntry) => void
  query?: string
  compact?: boolean
}

const LEVEL_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  ERROR:   { color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
  WARN:    { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)' },
  INFO:    { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)' },
  DEBUG:   { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)' },
  UNKNOWN: { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)' },
}

const escapeRegExp = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function highlight(text: string, query?: string) {
  if (!query?.trim()) return <>{text}</>
  const term = query.includes(':')
    ? query.split(':').slice(1).join(':').replace(/^"|"$/g, '').trim()
    : query.trim()
  if (!term) return <>{text}</>
  const parts = text.split(new RegExp(`(${escapeRegExp(term)})`, 'ig'))
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === term.toLowerCase()
          ? <Box key={i} component="span" sx={{ bgcolor: '#ffe45c', color: '#000', px: 0.25, borderRadius: 0.25 }}>{p}</Box>
          : <span key={i}>{p}</span>
      )}
    </>
  )
}

function LogRow({ log, onSelect, query }: { log: LogEntry; onSelect: (l: LogEntry) => void; query?: string }) {
  const levelKey = (log.level ?? 'UNKNOWN').toUpperCase()
  const cfg = LEVEL_CONFIG[levelKey] ?? LEVEL_CONFIG.UNKNOWN

  return (
    <Box
      onClick={() => onSelect(log)}
      sx={{
        display: 'grid',
        gridTemplateColumns: '168px 100px 52px 80px 1fr',
        alignItems: 'center',
        gap: 0,
        px: 1.5,
        py: 0.6,
        borderBottom: '1px solid',
        borderColor: 'divider',
        cursor: 'pointer',
        borderLeft: `3px solid ${levelKey === 'ERROR' || levelKey === 'WARN' ? cfg.color : 'transparent'}`,
        transition: 'background 0.1s',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      {/* Timestamp */}
      <Typography
        variant="caption"
        sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: 11, whiteSpace: 'nowrap', pr: 1.5 }}
      >
        {formatDateTime(log.timestamp)}
      </Typography>

      {/* Service */}
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, color: 'text.primary', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', pr: 1 }}
      >
        {log.service}
      </Typography>

      {/* Env */}
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', pr: 1 }}
      >
        {log.env ?? '—'}
      </Typography>

      {/* Level */}
      <Box sx={{ pr: 1 }}>
        <Chip
          label={levelKey}
          size="small"
          sx={{
            height: 18,
            fontSize: 10,
            fontWeight: 700,
            bgcolor: cfg.bg,
            color: cfg.color,
            border: `1px solid ${cfg.border}`,
            '& .MuiChip-label': { px: 0.75 },
          }}
        />
      </Box>

      {/* Message */}
      <Typography
        variant="caption"
        sx={{
          fontFamily: 'monospace',
          fontSize: 11,
          color: levelKey === 'ERROR' ? '#fca5a5' : levelKey === 'WARN' ? '#fde68a' : 'text.primary',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {highlight(log.message, query)}
      </Typography>
    </Box>
  )
}

function LogsTableComponent({ logs, onSelect, query }: LogsTableProps) {
  return (
    <Box sx={{
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1,
      overflow: 'visible',
      bgcolor: 'background.default',
    }}>
      {/* 헤더 */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: '168px 100px 52px 80px 1fr',
        px: 1.5, py: 0.75,
        borderBottom: '2px solid',
        borderColor: 'divider',
        bgcolor: 'action.hover',
        borderLeft: '3px solid transparent',
        position: 'sticky',
        top: 0,
        zIndex: 1,
      }}>
        {['TIMESTAMP', 'SERVICE', 'ENV', 'LEVEL', 'MESSAGE'].map(h => (
          <Typography key={h} variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 10, letterSpacing: 0.5 }}>
            {h}
          </Typography>
        ))}
      </Box>

      {/* 로그 행 */}
      {logs.map(log => (
        <LogRow key={log.id} log={log} onSelect={onSelect} query={query} />
      ))}
    </Box>
  )
}

const LogsTable = memo(LogsTableComponent)
export default LogsTable
