'use client'

import { Box, Typography, Chip, Stack } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import RefreshIcon from '@mui/icons-material/Refresh'
import { IconButton } from '@mui/material'

import { useState, useEffect } from 'react'

type ServiceHealth = { service: string; env?: string; error_rate: number; rds_cpu?: number }

interface Props {
  serviceHealth: ServiceHealth[]
  isLoading: boolean
  onRefresh: () => void
  lastUpdated: Date | null
}

export default function StatusBanner({ serviceHealth, isLoading, onRefresh, lastUpdated }: Props) {
  const [elapsed, setElapsed] = useState<number | null>(null)

  useEffect(() => {
    if (!lastUpdated) { setElapsed(null); return }

    let id: ReturnType<typeof setInterval>

    const schedule = () => {
      const secs = Math.floor((Date.now() - lastUpdated.getTime()) / 1000)
      setElapsed(secs)
      const next = secs >= 60 ? 60000 : 1000
      id = setInterval(() => {
        clearInterval(id)
        schedule()
      }, next)
    }

    schedule()
    return () => clearInterval(id)
  }, [lastUpdated])

  const services = serviceHealth.filter(h => h.rds_cpu === undefined)
  const critical = services.filter(s => s.error_rate >= 60)
  const degraded = services.filter(s => s.error_rate >= 1 && s.error_rate < 60)

  const status = critical.length > 0 ? 'critical' : degraded.length > 0 ? 'degraded' : 'healthy'

  const config = {
    healthy: {
      bg: 'linear-gradient(90deg, #052e16 0%, #14532d 100%)',
      border: '#16a34a',
      icon: <CheckCircleIcon sx={{ fontSize: 22, color: '#4ade80' }} />,
      text: 'All systems operational',
      sub: `${services.length} services monitored`,
      chipColor: '#4ade80',
      chipBg: 'rgba(74,222,128,0.15)',
    },
    degraded: {
      bg: 'linear-gradient(90deg, #1c1400 0%, #422006 100%)',
      border: '#d97706',
      icon: <WarningAmberIcon sx={{ fontSize: 22, color: '#fbbf24' }} />,
      text: `${degraded.length} service${degraded.length > 1 ? 's' : ''} degraded`,
      sub: degraded.map(s => s.service).join(', '),
      chipColor: '#fbbf24',
      chipBg: 'rgba(251,191,36,0.15)',
    },
    critical: {
      bg: 'linear-gradient(90deg, #1c0000 0%, #450a0a 100%)',
      border: '#dc2626',
      icon: <ErrorOutlineIcon sx={{ fontSize: 22, color: '#f87171' }} />,
      text: `Critical: ${critical.length} service${critical.length > 1 ? 's' : ''} in error`,
      sub: critical.map(s => s.service).join(', '),
      chipColor: '#f87171',
      chipBg: 'rgba(248,113,113,0.15)',
    },
  }[status]

  return (
    <Box
      sx={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: 2,
        px: 3,
        py: 1.75,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
      }}
    >
      <Stack direction="row" alignItems="center" gap={1.5}>
        {config.icon}
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 700, color: '#f1f5f9', lineHeight: 1.3 }}>
            {isLoading ? 'Checking system status…' : config.text}
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            {config.sub}
          </Typography>
        </Box>
        {!isLoading && (
          <Chip
            label={status.toUpperCase()}
            size="small"
            sx={{ bgcolor: config.chipBg, color: config.chipColor, fontWeight: 700, fontSize: 11, border: `1px solid ${config.chipColor}44` }}
          />
        )}
      </Stack>

      <Stack direction="row" alignItems="center" gap={1.5}>
        {elapsed !== null && (
          <Typography variant="caption" sx={{ color: '#fff', whiteSpace: 'nowrap' }}>
            Updated {elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m`} ago
          </Typography>
        )}
        <IconButton size="small" onClick={onRefresh} sx={{ color: '#64748b', '&:hover': { color: '#94a3b8' } }}>
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  )
}
