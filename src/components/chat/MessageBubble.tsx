'use client'

import { useTheme } from '@mui/material/styles'
import { Box, Avatar, Typography } from '@mui/material'
import { AiMessage } from '@/lib/types'

interface MessageBubbleProps {
  message: AiMessage
  isUser: boolean
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({ message, isUser }: MessageBubbleProps) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const time = formatTime(message.timestamp)

  if (isUser) {
    const tailColor = isDark ? '#9333ea' : '#a855f7'

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', px: 1, gap: 0.5 }}>
        <Box sx={{ position: 'relative', maxWidth: '72%' }}>
          <Box
            sx={{
              px: 2,
              py: 1.25,
              borderRadius: '18px 18px 0px 18px',
              background: isDark
                ? 'linear-gradient(135deg, #7e22ce 0%, #9333ea 100%)'
                : 'linear-gradient(135deg, #9333ea 0%, #a855f7 100%)',
              color: '#fff',
              boxShadow: isDark
                ? '0 2px 12px rgba(147,51,234,0.35)'
                : '0 2px 8px rgba(147,51,234,0.25)',
            }}
          >
            <Typography
              variant="body2"
              sx={{ fontSize: '0.875rem', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
            >
              {message.content}
            </Typography>
          </Box>
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              right: -7,
              width: 0,
              height: 0,
              borderStyle: 'solid',
              borderWidth: '8px 0 0 8px',
              borderColor: `transparent transparent transparent ${tailColor}`,
            }}
          />
        </Box>
        <Typography sx={{ fontSize: '0.68rem', color: theme.palette.text.disabled, pr: 0.5 }}>
          {time}
        </Typography>
      </Box>
    )
  }

  const bubbleBg = isDark ? '#0f172a' : '#ffffff'
  const borderColor = isDark ? 'rgba(147,51,234,0.4)' : 'rgba(147,51,234,0.35)'

  return (
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', px: 1 }}>
      <Avatar
        src="/logo/favicon-32x32.png"
        alt="LogTech AI"
        sx={{
          width: 30,
          height: 30,
          flexShrink: 0,
          mt: -1.5,
          border: `1px solid ${isDark ? 'rgba(147,51,234,0.3)' : 'rgba(147,51,234,0.2)'}`,
          bgcolor: isDark ? '#1e1b4b' : '#faf5ff',
        }}
      />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxWidth: '80%' }}>
        <Box sx={{ position: 'relative' }}>
          {/* 꼬리 - 왼쪽 위 */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: -8,
              width: 0,
              height: 0,
              borderStyle: 'solid',
              borderWidth: '0 8px 8px 0',
              borderColor: `transparent ${borderColor} transparent transparent`,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 1,
              left: -5,
              width: 0,
              height: 0,
              borderStyle: 'solid',
              borderWidth: '0 6px 6px 0',
              borderColor: `transparent ${bubbleBg} transparent transparent`,
            }}
          />
          <Box
            sx={{
              px: 2,
              py: 1.25,
              borderRadius: '0px 18px 18px 18px',
              bgcolor: bubbleBg,
              border: `1px solid ${borderColor}`,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.875rem',
                lineHeight: 1.75,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: theme.palette.text.primary,
              }}
            >
              {message.content}
            </Typography>
            {message.metadata?.actionType && (
              <Box
                component="button"
                onClick={() => console.log('Action:', message.metadata)}
                sx={{
                  mt: 1,
                  fontSize: '0.75rem',
                  px: 1.25,
                  py: 0.5,
                  bgcolor: 'transparent',
                  color: theme.palette.primary.main,
                  border: `1px solid ${theme.palette.primary.main}40`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  '&:hover': {
                    bgcolor: `${theme.palette.primary.main}12`,
                    borderColor: theme.palette.primary.main,
                  },
                }}
              >
                → {message.metadata.actionType.replace('_', ' ')}
              </Box>
            )}
          </Box>
        </Box>
        <Typography sx={{ fontSize: '0.68rem', color: theme.palette.text.disabled, pl: 0.5 }}>
          {time}
        </Typography>
      </Box>
    </Box>
  )
}
