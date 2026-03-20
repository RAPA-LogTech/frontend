'use client';

import { memo } from 'react';

import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Paper,
  Box,
  Typography,
} from '@mui/material';
import { LogEntry } from '@/lib/types';
import { formatDateTime } from '@/lib/formatters';

type LogsTableProps = {
  logs: LogEntry[];
  onSelect: (log: LogEntry) => void;
  query?: string;
  compact?: boolean;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const highlightText = (text: string, query?: string) => {
  if (!query?.trim()) return <>{text}</>;

  const term = query.includes(':') ? query.split(':').slice(1).join(':').replace(/^"|"$/g, '').trim() : query.trim();
  if (!term) return <>{text}</>;

  const regex = new RegExp(`(${escapeRegExp(term)})`, 'ig');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => (
        part.toLowerCase() === term.toLowerCase() ? (
          <Box key={`${part}-${index}`} component="span" sx={{ bgcolor: '#ffe45c', color: '#000000', px: 0.25, borderRadius: 0.25 }}>
            {part}
          </Box>
        ) : (
          <Box key={`${part}-${index}`} component="span">
            {part}
          </Box>
        )
      ))}
    </>
  );
};

function LogsTableComponent({ logs, onSelect, query, compact = false }: LogsTableProps) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return { bgcolor: 'rgba(239, 68, 68, 0.1)', textColor: '#ef4444' };
      case 'WARN':
        return { bgcolor: 'rgba(240, 153, 75, 0.1)', textColor: '#f59e0b' };
      case 'INFO':
        return { bgcolor: 'rgba(59, 130, 246, 0.1)', textColor: '#3b82f6' };
      default:
        return { bgcolor: 'rgba(16, 185, 129, 0.1)', textColor: '#10b981' };
    }
  };

  return (
    <TableContainer
      component={Paper}
      sx={{
        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff',
        border: '1px solid',
        borderColor: (theme) => theme.palette.divider,
      }}
    >
      <Table sx={{ minWidth: 650 }}>
        <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff' }}>
          <TableRow sx={{ borderBottom: '1px solid', borderColor: (theme) => theme.palette.divider }}>
            <TableCell
              sx={{
                color: (theme) => theme.palette.text.primary,
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '10px 12px',
                whiteSpace: 'nowrap',
              }}
            >
              Timestamp
            </TableCell>
            <TableCell
              sx={{
                color: (theme) => theme.palette.text.primary,
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '10px 12px',
                whiteSpace: 'nowrap',
              }}
            >
              Service
            </TableCell>
            <TableCell
              sx={{
                color: (theme) => theme.palette.text.primary,
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '10px 12px',
                whiteSpace: 'nowrap',
              }}
            >
              Env
            </TableCell>
            <TableCell
              sx={{
                color: (theme) => theme.palette.text.primary,
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '10px 12px',
                whiteSpace: 'nowrap',
              }}
            >
              Level
            </TableCell>
            <TableCell
              sx={{
                color: (theme) => theme.palette.text.primary,
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '10px 12px',
                whiteSpace: 'nowrap',
              }}
            >
              Message
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map((row) => (
            <TableRow
              key={row.id}
              onClick={() => onSelect(row)}
              sx={{
                borderBottom: '1px solid',
                borderColor: (theme) => theme.palette.divider,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1e293b' : '#f1f5f9',
                },
              }}
            >
              <TableCell sx={{ color: (theme) => theme.palette.text.secondary, fontSize: '0.85rem', fontWeight: 500, padding: '10px 12px', fontFamily: 'monospace' }}>
                {formatDateTime(row.timestamp)}
              </TableCell>
              <TableCell sx={{ color: (theme) => theme.palette.text.primary, fontSize: '0.875rem', fontWeight: 500, padding: '10px 12px' }}>
                {row.service}
              </TableCell>
              <TableCell sx={{ color: (theme) => theme.palette.text.primary, fontSize: '0.875rem', fontWeight: 500, padding: '10px 12px' }}>
                {row.env}
              </TableCell>
              <TableCell sx={{ fontSize: '0.875rem', padding: '10px 12px' }}>
                {(() => {
                  const color = getLevelColor(row.level);
                  return (
                    <Chip
                      label={row.level}
                      size="small"
                      sx={{
                        bgcolor: color.bgcolor,
                        color: color.textColor,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    />
                  );
                })()}
              </TableCell>
              <TableCell
                sx={{
                  color: (theme) => theme.palette.text.primary,
                  fontSize: '0.85rem',
                  maxWidth: compact ? 620 : 280,
                  padding: '10px 12px',
                }}
              >
                <Typography variant="body2" sx={{ fontFamily: compact ? 'monospace' : 'inherit', whiteSpace: compact ? 'normal' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {compact
                    ? highlightText(
                        `{ "level": "${row.level.toLowerCase()}", "service": "${row.service}", "msg": "${row.message}", "traceId": "${row.metadata?.traceId ?? row.traceId ?? '-'}" }`,
                        query
                      )
                    : highlightText(row.message, query)}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

const LogsTable = memo(LogsTableComponent);

export default LogsTable;
