'use client'

import { Box, BoxProps } from '@mui/material'
import { FiberManualRecord as LiveIcon } from '@mui/icons-material'

interface LiveButtonProps extends Omit<BoxProps, 'onClick' | 'value'> {
  value: boolean
  onChange: (value: boolean) => void
}

export default function LiveButton({ value, onChange, ...props }: LiveButtonProps) {
  return (
    <Box
      size="small"
      variant="outlined"
      onClick={() => onChange(!value)}
      sx={{
        minWidth: 72,
        px: 1,
        py: 0.25,
        borderRadius: 999,
        borderColor: value ? 'success.main' : 'divider',
        color: value ? 'success.main' : 'text.secondary',
        alignSelf: 'center',
        '@keyframes neonPulse': {
          '0%, 100%': {
            opacity: 1,
            textShadow: '0 0 6px rgba(74, 222, 128, 0.75), 0 0 12px rgba(74, 222, 128, 0.45)',
          },
          '50%': { opacity: 0.42, textShadow: '0 0 1px rgba(74, 222, 128, 0.3)' },
        },
      }}
      {...props}
    >
      <Box
        sx={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          bgcolor: value ? 'success.main' : 'text.disabled',
        }}
      />
      <Box sx={{ pl: 0.5 }}>
        <LiveIcon
          sx={{
            color: value ? 'success.main' : 'text.disabled',
            animation: value ? 'neonPulse 1.2s ease-in-out infinite' : 'none',
          }}
        />
      </Box>
    </Box>
  )
}
