'use client'

import React from 'react'
import { Box, Card, CardContent, Stack, Typography, Tooltip, Chip } from '@mui/material'
import InfoIcon from '@mui/icons-material/Info'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'

interface KPICardProps {
  title: string
  value: number | string
  unit?: string
  trend?: {
    value: number
    direction: 'up' | 'down' | 'stable'
    timeRange: string
  }
  status?: 'healthy' | 'warning' | 'critical' | 'info'
  tooltip?: string
  onClick?: () => void
  sparkline?: Array<{ ts: number; value: number }>
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit = '',
  trend,
  status = 'info',
  tooltip,
  onClick,
  sparkline,
}) => {
  const statusColors = {
    healthy: { bg: '#10B98133', text: '#10B981', border: '#10B98166' },
    warning: { bg: '#F59E0B33', text: '#F59E0B', border: '#F59E0B66' },
    critical: { bg: '#EF444433', text: '#EF4444', border: '#EF444466' },
    info: { bg: '#3B82F633', text: '#3B82F6', border: '#3B82F666' },
  }

  const trendColor =
    trend?.direction === 'up' ? '#EF4444' : trend?.direction === 'down' ? '#10B981' : '#9CA3AF'

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 200ms',
        '&:hover': onClick
          ? {
              backgroundColor: 'action.hover',
              borderColor: 'primary.main',
            }
          : {},
      }}
    >
      <CardContent>
        {/* Header */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: '13px',
              fontWeight: 600,
              flex: 1,
              color: 'text.secondary',
              textTransform: 'capitalize',
            }}
          >
            {title}
          </Typography>
          {tooltip && (
            <Tooltip title={tooltip}>
              <InfoIcon sx={{ fontSize: '16px', color: 'text.secondary' }} />
            </Tooltip>
          )}
        </Stack>

        {/* Value */}
        <Box sx={{ mb: 2 }}>
          <Typography
            sx={{
              fontSize: '32px',
              fontWeight: 700,
              fontFamily: '"Monaco", "Courier New", monospace',
              color: 'text.primary',
              letterSpacing: '-0.5px',
            }}
          >
            {typeof value === 'number' ? value.toFixed(1) : value}
            {unit && (
              <span style={{ fontSize: '18px', marginLeft: '4px', fontWeight: 500 }}>{unit}</span>
            )}
          </Typography>
        </Box>

        {/* Trend or Status Chips */}
        <Stack direction="row" spacing={1} sx={{ marginBottom: 1 }}>
          {trend && (
            <Chip
              size="small"
              icon={
                trend.direction === 'up' ? (
                  <TrendingUpIcon sx={{ fontSize: '16px', color: trendColor }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: '16px', color: trendColor }} />
                )
              }
              label={`${trend.direction === 'up' ? '+' : '-'}${Math.abs(trend.value)}% ${trend.timeRange}`}
              sx={{
                fontSize: '11px',
                height: '20px',
                backgroundColor: statusColors[status].bg,
                color: trendColor,
                border: `1px solid ${trendColor}33`,
              }}
            />
          )}
          {status && !trend && (
            <Chip
              size="small"
              label={status}
              sx={{
                fontSize: '11px',
                height: '20px',
                backgroundColor: statusColors[status].bg,
                color: statusColors[status].text,
                border: `1px solid ${statusColors[status].border}`,
                textTransform: 'capitalize',
              }}
            />
          )}
        </Stack>

        {/* Sparkline placeholder */}
        {sparkline && (
          <Box
            sx={{
              height: '24px',
              backgroundColor: 'background.default',
              borderRadius: '4px',
              marginTop: '12px',
            }}
          >
            {/* Sparkline chart would go here */}
            <Typography variant="caption" sx={{ fontSize: '9px', color: 'text.disabled' }}>
              📊 Trend (6h)
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default KPICard
