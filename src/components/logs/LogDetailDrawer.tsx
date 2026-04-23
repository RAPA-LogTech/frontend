'use client'

import { useRouter } from 'next/navigation'
import { Box, Chip, Divider, Drawer, IconButton, Stack, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { formatDateTime } from '@/lib/formatters'
import type { LogEntry } from '@/lib/types'

interface Props {
  selectedLog: LogEntry | null
  onClose: () => void
}

const LEVEL_CONFIG: Record<string, { bg: string; color: string }> = {
  ERROR: { bg: 'rgba(248,113,113,0.15)', color: '#f87171' },
  WARN: { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24' },
  INFO: { bg: 'rgba(96,165,250,0.15)', color: '#60a5fa' },
  DEBUG: { bg: 'rgba(52,211,153,0.15)', color: '#34d399' },
  UNKNOWN: { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
}

function CopyButton({ value }: { value: string }) {
  return (
    <IconButton
      size="small"
      onClick={() => navigator.clipboard.writeText(value)}
      sx={{ color: 'text.secondary', p: 0.25, '&:hover': { color: 'text.primary' } }}
    >
      <ContentCopyIcon sx={{ fontSize: 13 }} />
    </IconButton>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 0.5, fontSize: 10 }}
      >
        {label}
      </Typography>
      <Box sx={{ mt: 0.25 }}>{children}</Box>
    </Box>
  )
}

function MonoText({ value, copyable }: { value: string; copyable?: boolean }) {
  return (
    <Stack direction="row" alignItems="center" gap={0.5}>
      <Typography
        variant="body2"
        sx={{
          fontFamily: 'monospace',
          fontSize: 12,
          color: 'text.primary',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </Typography>
      {copyable && <CopyButton value={value} />}
    </Stack>
  )
}

export function LogDetailDrawer({ selectedLog, onClose }: Props) {
  const router = useRouter()
  const log = selectedLog
  const levelKey = (log?.level ?? 'UNKNOWN').toUpperCase()
  const levelCfg = LEVEL_CONFIG[levelKey] ?? LEVEL_CONFIG.UNKNOWN

  const metaEntries = Object.entries(log?.metadata ?? {}).filter(([, v]) => v !== undefined)
  const tagEntries = Object.entries(log?.tags ?? {})

  return (
    <Drawer
      anchor="right"
      open={log !== null}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100vw', sm: 440 },
          bgcolor: 'background.paper',
          borderLeft: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {log && (
        <>
          {/* 헤더 */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: levelCfg.bg,
            }}
          >
            <Stack direction="row" alignItems="center" gap={1}>
              <Chip
                label={levelKey}
                size="small"
                sx={{
                  bgcolor: levelCfg.bg,
                  color: levelCfg.color,
                  fontWeight: 800,
                  fontSize: 11,
                  border: `1px solid ${levelCfg.color}44`,
                }}
              />
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {log.service}
              </Typography>
              {log.env && (
                <Chip
                  label={log.env}
                  size="small"
                  variant="outlined"
                  sx={{ height: 18, fontSize: 10 }}
                />
              )}
            </Stack>
            <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* 본문 */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {/* 메시지 */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'action.hover',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: 12,
                  lineHeight: 1.6,
                  wordBreak: 'break-all',
                  color: 'text.primary',
                }}
              >
                {log.message}
              </Typography>
            </Box>

            <Divider />

            {/* 기본 필드 */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              <Field label="TIMESTAMP">
                <MonoText value={formatDateTime(log.timestamp)} />
              </Field>
              <Field label="LOG ID">
                <MonoText value={log.id} copyable />
              </Field>
              {log.source && (
                <Field label="SOURCE">
                  <MonoText value={log.source} />
                </Field>
              )}
              {log.traceId && (
                <Field label="TRACE ID">
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    <MonoText value={log.traceId} copyable />
                    <IconButton
                      size="small"
                      onClick={() => {
                        onClose()
                        router.push(`/traces/${log.traceId}`)
                      }}
                      sx={{ color: '#60a5fa', p: 0.25 }}
                    >
                      <OpenInNewIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                  </Stack>
                </Field>
              )}
            </Box>

            {/* 메타데이터 */}
            {metaEntries.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      fontSize: 10,
                      display: 'block',
                      mb: 1,
                    }}
                  >
                    METADATA
                  </Typography>
                  <Box
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      overflow: 'hidden',
                    }}
                  >
                    {metaEntries.map(([k, v], i) => (
                      <Box
                        key={k}
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: '120px 1fr',
                          px: 1.25,
                          py: 0.75,
                          borderBottom: i < metaEntries.length - 1 ? '1px solid' : 'none',
                          borderColor: 'divider',
                          '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontWeight: 600,
                            fontFamily: 'monospace',
                            fontSize: 11,
                          }}
                        >
                          {k}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: 11,
                            wordBreak: 'break-all',
                            color: 'text.primary',
                          }}
                        >
                          {String(v)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </>
            )}

            {/* 태그 */}
            {tagEntries.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      fontSize: 10,
                      display: 'block',
                      mb: 1,
                    }}
                  >
                    TAGS
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {tagEntries.map(([k, v]) => (
                      <Chip
                        key={k}
                        label={`${k}: ${v}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontFamily: 'monospace', fontSize: 10, height: 22 }}
                      />
                    ))}
                  </Box>
                </Box>
              </>
            )}
          </Box>
        </>
      )}
    </Drawer>
  )
}
