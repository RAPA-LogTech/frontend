'use client'

import { useTheme } from '@mui/material/styles'
import { Box, IconButton, Typography } from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { AiConversation } from '@/lib/types'

interface ChatSidebarProps {
  conversations: AiConversation[]
  activeConversationId: string | null
  onSelectConversation: (id: string) => void
  onCreateNew: () => void
  onDeleteConversation?: (id: string) => void
}

const formatTimestamp = (timestamp: number) => {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`
  return new Date(timestamp).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

export default function ChatSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onCreateNew,
  onDeleteConversation,
}: ChatSidebarProps) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Box
      sx={{
        width: 240,
        flexShrink: 0,
        borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 1.5,
          py: 1.25,
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.disabled,
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            fontSize: '0.7rem',
          }}
        >
          대화 목록
        </Typography>
        <IconButton
          size="small"
          onClick={onCreateNew}
          sx={{
            width: 26,
            height: 26,
            color: theme.palette.text.secondary,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            borderRadius: '8px',
            '&:hover': {
              bgcolor: 'rgba(147,51,234,0.12)',
              color: theme.palette.primary.main,
              borderColor: 'rgba(147,51,234,0.4)',
            },
          }}
        >
          <AddIcon sx={{ fontSize: '0.9rem' }} />
        </IconButton>
      </Box>

      {/* List */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          py: 0.75,
          '&::-webkit-scrollbar': { width: '3px' },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            borderRadius: '3px',
          },
        }}
      >
        {conversations.map(conv => {
          const isActive = activeConversationId === conv.id
          return (
            <Box
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              sx={{
                mx: 0.75,
                mb: 0.25,
                px: 1.25,
                py: 1,
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: isActive
                  ? isDark
                    ? 'rgba(147,51,234,0.15)'
                    : 'rgba(147,51,234,0.08)'
                  : 'transparent',
                border: `1px solid ${isActive ? 'rgba(147,51,234,0.3)' : 'transparent'}`,
                transition: 'all 0.12s ease',
                '&:hover': {
                  bgcolor: isActive
                    ? isDark
                      ? 'rgba(147,51,234,0.18)'
                      : 'rgba(147,51,234,0.1)'
                    : isDark
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(0,0,0,0.04)',
                  '& .delete-btn': { opacity: 1 },
                },
                '& .delete-btn': { opacity: 0, transition: 'opacity 0.12s' },
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.8rem',
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? theme.palette.primary.light : theme.palette.text.primary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.4,
                  }}
                >
                  {conv.title}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.7rem',
                    color: theme.palette.text.disabled,
                    mt: 0.1,
                    display: 'block',
                  }}
                >
                  {formatTimestamp(conv.updatedAt)}
                </Typography>
              </Box>
              {onDeleteConversation && (
                <IconButton
                  className="delete-btn"
                  size="small"
                  onClick={e => {
                    e.stopPropagation()
                    onDeleteConversation(conv.id)
                  }}
                  sx={{
                    p: 0.25,
                    color: theme.palette.text.disabled,
                    flexShrink: 0,
                    '&:hover': { color: theme.palette.error.main, bgcolor: 'rgba(239,68,68,0.1)' },
                  }}
                >
                  <DeleteIcon sx={{ fontSize: '0.85rem' }} />
                </IconButton>
              )}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
