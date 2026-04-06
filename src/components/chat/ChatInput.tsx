'use client'

import { useTheme } from '@mui/material/styles'
import { Box, IconButton, TextField } from '@mui/material'
import { ArrowUpward as SendIcon } from '@mui/icons-material'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
  inputRef?: React.Ref<HTMLInputElement>
}

export default function ChatInput({ value, onChange, onSend, disabled = false, inputRef }: ChatInputProps) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const canSend = !disabled && value.trim().length > 0

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (canSend) onSend()
    }
  }

  return (
    <Box
      sx={{
        p: 2,
        pt: 1.5,
        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
          borderRadius: '16px',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
          px: 1.5,
          py: 0.75,
          transition: 'border-color 0.15s',
          '&:focus-within': {
            borderColor: 'rgba(147,51,234,0.5)',
            boxShadow: '0 0 0 3px rgba(147,51,234,0.08)',
          },
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={5}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="메시지를 입력하세요..."
          variant="standard"
          inputRef={inputRef}
          sx={{
            '& .MuiInput-root': {
              fontSize: '0.875rem',
              color: theme.palette.text.primary,
              '&:before, &:after': { display: 'none' },
            },
            '& .MuiInputBase-input': {
              py: 0.5,
              lineHeight: 1.6,
              '&::placeholder': { color: theme.palette.text.disabled, opacity: 1 },
            },
            '& .MuiInputBase-input.Mui-disabled': {
              WebkitTextFillColor: theme.palette.text.disabled,
            },
          }}
        />
        <IconButton
          onClick={onSend}
          disabled={!canSend}
          size="small"
          sx={{
            mb: 0.25,
            flexShrink: 0,
            width: 32,
            height: 32,
            background: canSend
              ? 'linear-gradient(135deg, #7e22ce 0%, #9333ea 100%)'
              : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            color: canSend ? '#fff' : theme.palette.text.disabled,
            transition: 'all 0.15s ease',
            '&:hover': {
              background: canSend
                ? 'linear-gradient(135deg, #6b21a8 0%, #7e22ce 100%)'
                : undefined,
              transform: canSend ? 'scale(1.05)' : undefined,
            },
            '&.Mui-disabled': { opacity: 1 },
          }}
        >
          <SendIcon sx={{ fontSize: '1rem' }} />
        </IconButton>
      </Box>
      <Box sx={{ mt: 0.75, textAlign: 'center' }}>
        <Box
          component="span"
          sx={{ fontSize: '0.7rem', color: theme.palette.text.disabled }}
        >
          Enter로 전송 · Shift+Enter로 줄바꿈
        </Box>
      </Box>
    </Box>
  )
}
