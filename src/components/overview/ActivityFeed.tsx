'use client'

import { useRouter } from 'next/navigation'
import { Box, Paper, Typography, Chip, Stack } from '@mui/material'
import ArticleIcon from '@mui/icons-material/Article'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import LiveButton from '@/components/logs/LogFilters/LiveButton'
import type { LogEntry, Trace } from '@/lib/types'

interface Props {
  errorLogs: LogEntry[]
  errorTraces: Trace[]
}

type FeedItem =
  | { kind: 'log'; ts: number; service: string; message: string; level: string; id: string }
  | { kind: 'trace'; ts: number; service: string; operation: string; duration: number; id: string }

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export default function ActivityFeed({ errorLogs, errorTraces }: Props) {
  const router = useRouter()

  const items: FeedItem[] = [
    ...errorLogs.slice(0, 6).map(log => ({
      kind: 'log' as const,
      ts: new Date(log.timestamp).getTime(),
      service: log.service,
      message: log.message,
      level: log.level ?? 'UNKNOWN',
      id: log.id,
    })),
    ...errorTraces.slice(0, 4).map(trace => ({
      kind: 'trace' as const,
      ts: trace.startTime,
      service: trace.service,
      operation: trace.operation,
      duration: trace.duration,
      id: trace.id,
    })),
  ]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 8)

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper', flex: '1 1 0', minWidth: 0 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Activity Feed
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Recent errors from logs &amp; traces
          </Typography>
        </Box>
        <LiveButton value isStreaming onChange={() => {}} />
      </Box>

      {items.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: 160,
            gap: 1,
          }}
        >
          <Box sx={{ fontSize: 32 }}>✅</Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            No recent errors
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            All systems running smoothly
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {/* 타임라인 세로 바 */}
          <Box
            sx={{
              position: 'absolute',
              left: 11,
              top: 8,
              bottom: 8,
              width: 2,
              bgcolor: 'divider',
              borderRadius: 1,
            }}
          />

          {items.map((item, idx) => (
            <Box
              key={`${item.kind}-${item.id}-${idx}`}
              onClick={() =>
                item.kind === 'log'
                  ? router.push(`/logs?service=${item.service}`)
                  : router.push(`/traces/${item.id}`)
              }
              sx={{
                display: 'flex',
                gap: 1.5,
                py: 1,
                px: 0.5,
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
                position: 'relative',
              }}
            >
              {/* 타임라인 아이콘 */}
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: item.kind === 'log' ? 'rgba(248,113,113,0.15)' : 'rgba(251,146,60,0.15)',
                  border: `2px solid ${item.kind === 'log' ? '#f87171' : '#fb923c'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  zIndex: 1,
                }}
              >
                {item.kind === 'log' ? (
                  <ArticleIcon sx={{ fontSize: 12, color: '#f87171' }} />
                ) : (
                  <AccountTreeIcon sx={{ fontSize: 12, color: '#fb923c' }} />
                )}
              </Box>

              {/* 내용 */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" alignItems="center" gap={0.75} sx={{ mb: 0.25 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {item.service}
                  </Typography>
                  <Chip
                    label={item.kind === 'log' ? item.level : 'TRACE ERROR'}
                    size="small"
                    sx={{
                      height: 16,
                      fontSize: 10,
                      fontWeight: 700,
                      bgcolor:
                        item.kind === 'log' ? 'rgba(248,113,113,0.15)' : 'rgba(251,146,60,0.15)',
                      color: item.kind === 'log' ? '#f87171' : '#fb923c',
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', ml: 'auto', whiteSpace: 'nowrap' }}
                  >
                    {timeAgo(item.ts)}
                  </Typography>
                </Stack>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.kind === 'log'
                    ? item.message
                    : `${item.operation} · ${(item.duration / 1000).toFixed(3)}s`}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  )
}
