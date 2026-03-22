'use client'

import { Box, Typography, SxProps, Theme } from '@mui/material'
import { FiberManualRecord as LiveIcon } from '@mui/icons-material'

interface LiveButtonProps {
  value: boolean
  isStreaming?: boolean
  onChange: (value: boolean) => void
  sx?: SxProps<Theme>
}

export default function LiveButton({ value, isStreaming = false, onChange, sx }: LiveButtonProps) {
  const isActive = value
  const isPulsing = isActive && isStreaming

  return (
    <Box
      onClick={() => onChange(!value)}
      sx={{
        px: 1.5,
        py: 0.25,
        borderRadius: 999,
        border: 1,
        borderColor: isActive ? 'success.main' : 'divider',
        color: isActive ? 'success.main' : 'text.secondary',
        alignSelf: 'center',
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        cursor: 'pointer',
        '@keyframes neonPulse': {
          '0%, 100%': {
            opacity: 1,
            textShadow: '0 0 6px rgba(74, 222, 128, 0.75), 0 0 12px rgba(74, 222, 128, 0.45)',
          },
          '50%': { opacity: 0.42, textShadow: '0 0 1px rgba(74, 222, 128, 0.3)' },
        },
        ...sx,
      }}
    >
      <LiveIcon
        sx={{
          color: isActive ? 'success.main' : 'text.disabled',
          animation: isPulsing ? 'neonPulse 1.2s ease-in-out infinite' : 'none',
          fontSize: 12,
        }}
      />
      <Typography
        variant="body2"
        sx={{
          color: isActive ? 'success.main' : 'text.disabled',
          fontWeight: 600,
          fontSize: '0.75rem',
          animation: isPulsing ? 'neonPulse 1.2s ease-in-out infinite' : 'none',
        }}
      >
        LIVE
      </Typography>
    </Box>
  )
}
