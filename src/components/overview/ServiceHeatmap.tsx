'use client'

import { useRouter } from 'next/navigation'
import { Box, Paper, Typography, Tooltip } from '@mui/material'

type ServiceHealth = { service: string; env?: string; error_rate: number; rds_cpu?: number }

interface Props {
  serviceHealth: ServiceHealth[]
}

function getHeatColor(errorRate: number): { bg: string; text: string; border: string } {
  if (errorRate >= 60) return { bg: 'rgba(239,68,68,0.25)', text: '#fca5a5', border: '#ef4444' }
  if (errorRate >= 10) return { bg: 'rgba(239,68,68,0.15)', text: '#f87171', border: '#dc2626' }
  if (errorRate >= 2) return { bg: 'rgba(251,191,36,0.2)', text: '#fde68a', border: '#f59e0b' }
  if (errorRate >= 0.5) return { bg: 'rgba(251,191,36,0.1)', text: '#fbbf24', border: '#d97706' }
  return { bg: 'rgba(74,222,128,0.12)', text: '#86efac', border: '#22c55e' }
}

export default function ServiceHeatmap({ serviceHealth }: Props) {
  const router = useRouter()
  const services = serviceHealth.filter(h => h.rds_cpu === undefined)

  // 서비스명 × env 유니크 조합
  const serviceNames = [...new Set(services.map(s => s.service))].sort()
  const envs = [...new Set(services.map(s => s.env ?? 'unknown'))].sort()

  const getCell = (service: string, env: string) =>
    services.find(s => s.service === service && (s.env ?? 'unknown') === env)

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        flex: '0 0 380px',
        minWidth: 0,
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Service Health Matrix
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Error rate by service × environment
        </Typography>
      </Box>

      {services.length === 0 ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180 }}>
          <Typography variant="body2" color="text.secondary">
            No data
          </Typography>
        </Box>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          {/* Header row */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `120px repeat(${envs.length}, 1fr)`,
              gap: 0.5,
              mb: 0.5,
            }}
          >
            <Box />
            {envs.map(env => (
              <Typography
                key={env}
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: 'text.secondary',
                  textAlign: 'center',
                  letterSpacing: 0.5,
                }}
              >
                {env.toUpperCase()}
              </Typography>
            ))}
          </Box>

          {/* Data rows */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {serviceNames.map(svc => (
              <Box
                key={svc}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: `120px repeat(${envs.length}, 1fr)`,
                  gap: 0.5,
                  alignItems: 'center',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: 'text.secondary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    pr: 1,
                  }}
                >
                  {svc}
                </Typography>
                {envs.map(env => {
                  const cell = getCell(svc, env)
                  if (!cell) {
                    return (
                      <Box
                        key={env}
                        sx={{
                          height: 36,
                          borderRadius: 1,
                          bgcolor: 'action.hover',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      />
                    )
                  }
                  const colors = getHeatColor(cell.error_rate)
                  return (
                    <Tooltip
                      key={env}
                      title={`${svc} · ${env} · ${cell.error_rate.toFixed(2)}% error rate`}
                      arrow
                    >
                      <Box
                        onClick={() => router.push(`/logs?service=${svc}`)}
                        sx={{
                          height: 36,
                          borderRadius: 1,
                          bgcolor: colors.bg,
                          border: `1px solid ${colors.border}44`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          '&:hover': {
                            border: `1px solid ${colors.border}`,
                            transform: 'scale(1.04)',
                          },
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 700, color: colors.text, fontSize: 11 }}
                        >
                          {cell.error_rate.toFixed(1)}%
                        </Typography>
                      </Box>
                    </Tooltip>
                  )
                })}
              </Box>
            ))}
          </Box>

          {/* Legend */}
          <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap' }}>
            {[
              { label: '< 0.5%', color: '#22c55e' },
              { label: '0.5–2%', color: '#f59e0b' },
              { label: '2–10%', color: '#f87171' },
              { label: '≥ 60%', color: '#ef4444' },
            ].map(item => (
              <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: 0.5,
                    bgcolor: item.color,
                    opacity: 0.7,
                  }}
                />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10 }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  )
}
