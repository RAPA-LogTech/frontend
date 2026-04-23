'use client'

import { useRef, useEffect } from 'react'
import { useTheme } from '@mui/material/styles'
import { Box, Avatar, Typography, Skeleton } from '@mui/material'
import { AiMessage } from '@/lib/types'
import MessageBubble from './MessageBubble'

interface MessageAreaProps {
  messages: AiMessage[]
  isLoading: boolean
  isLoadingMessages?: boolean
  suggestedPrompts?: SuggestedPrompt[]
  onSuggestedPromptClick?: (prompt: string) => void
  compactPrompts?: boolean
}

export interface SuggestedPrompt {
  title: string
  icon: string
}

const defaultSuggestedPrompts: SuggestedPrompt[] = [
  { icon: '📊', title: '체크아웃 에러율이 왜 올랐는지 분석해줘' },
  { icon: '🐢', title: '응답이 느린 API 엔드포인트 찾아줘' },
  { icon: '🔗', title: '관련 로그랑 트레이스 연결해서 보여줘' },
  { icon: '🔔', title: '지금 발화 중인 알람 있으면 알려줘' },
]

export default function MessageArea({
  messages,
  isLoading,
  isLoadingMessages = false,
  suggestedPrompts = defaultSuggestedPrompts,
  onSuggestedPromptClick,
  compactPrompts = false,
}: MessageAreaProps) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // 메시지 로딩 중 스켈레톤
  if (isLoadingMessages) {
    return (
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          py: 3,
          px: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
        }}
      >
        {/* AI 말풍선 스켈레톤 */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          <Skeleton variant="circular" width={30} height={30} sx={{ flexShrink: 0 }} />
          <Box sx={{ flex: 1, maxWidth: '75%' }}>
            <Skeleton
              variant="rounded"
              height={18}
              width="90%"
              sx={{ mb: 0.75, borderRadius: '0px 12px 12px 12px' }}
            />
            <Skeleton variant="rounded" height={18} width="70%" sx={{ borderRadius: '12px' }} />
          </Box>
        </Box>
        {/* 유저 말풍선 스켈레톤 */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Skeleton
            variant="rounded"
            height={40}
            width="55%"
            sx={{ borderRadius: '18px 18px 0px 18px' }}
          />
        </Box>
        {/* AI 말풍선 스켈레톤 */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          <Skeleton variant="circular" width={30} height={30} sx={{ flexShrink: 0 }} />
          <Box sx={{ flex: 1, maxWidth: '80%' }}>
            <Skeleton
              variant="rounded"
              height={18}
              width="100%"
              sx={{ mb: 0.75, borderRadius: '0px 12px 12px 12px' }}
            />
            <Skeleton
              variant="rounded"
              height={18}
              width="85%"
              sx={{ mb: 0.75, borderRadius: '12px' }}
            />
            <Skeleton variant="rounded" height={18} width="60%" sx={{ borderRadius: '12px' }} />
          </Box>
        </Box>
        {/* 유저 말풍선 스켈레톤 */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Skeleton
            variant="rounded"
            height={40}
            width="40%"
            sx={{ borderRadius: '18px 18px 0px 18px' }}
          />
        </Box>
      </Box>
    )
  }

  if (messages.length === 0) {
    return (
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          p: 4,
        }}
      >
        {/* 로고 + 인사말 */}
        <Box sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '16px',

              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
            }}
          >
            <Avatar
              src="/logo/favicon-32x32.png"
              alt="LogTech AI"
              sx={{ width: 32, height: 32, bgcolor: 'transparent' }}
            />
          </Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, mb: 0.5, color: theme.palette.text.primary }}
          >
            무엇을 도와드릴까요?
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            아래 예시를 클릭하거나 직접 질문을 입력하세요
          </Typography>
        </Box>

        {/* 프롬프트 카드 */}
        {compactPrompts ? (
          // 1x4 세로 나열 (Drawer)
          <Box
            sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%', maxWidth: 480 }}
          >
            {suggestedPrompts.map(prompt => (
              <Box
                key={prompt.title}
                onClick={() => onSuggestedPromptClick?.(prompt.title)}
                sx={{
                  p: 1.5,
                  borderRadius: '12px',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`,
                  bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  '&:hover': {
                    border: '1px solid rgba(147,51,234,0.5)',
                    bgcolor: isDark ? 'rgba(147,51,234,0.08)' : 'rgba(147,51,234,0.05)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(147,51,234,0.15)',
                  },
                }}
              >
                <Typography sx={{ fontSize: '1.1rem', lineHeight: 1, flexShrink: 0 }}>
                  {prompt.icon}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.82rem', lineHeight: 1.4, color: theme.palette.text.secondary }}
                >
                  {prompt.title}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          // 2x2 그리드 (전체 대화창)
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 1,
              width: '100%',
              maxWidth: 600,
            }}
          >
            {suggestedPrompts.map(prompt => (
              <Box
                key={prompt.title}
                onClick={() => onSuggestedPromptClick?.(prompt.title)}
                sx={{
                  p: 1.5,
                  borderRadius: '12px',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`,
                  bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    border: '1px solid rgba(147,51,234,0.5)',
                    bgcolor: isDark ? 'rgba(147,51,234,0.08)' : 'rgba(147,51,234,0.05)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(147,51,234,0.15)',
                  },
                }}
              >
                <Typography sx={{ fontSize: '1rem', mb: 0.5 }}>{prompt.icon}</Typography>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.8rem', lineHeight: 1.4, color: theme.palette.text.secondary }}
                >
                  {prompt.title}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    )
  }

  return (
    <Box
      sx={{
        flex: 1,
        overflowY: 'auto',
        py: 3,
        px: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
        '&::-webkit-scrollbar': { width: '4px' },
        '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderRadius: '4px',
        },
      }}
    >
      {messages.map(message => (
        <MessageBubble key={message.id} message={message} isUser={message.role === 'user'} />
      ))}

      {isLoading && (
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
                borderColor: `transparent ${isDark ? 'rgba(147,51,234,0.4)' : 'rgba(147,51,234,0.35)'} transparent transparent`,
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
                borderColor: `transparent ${isDark ? '#0f172a' : '#ffffff'} transparent transparent`,
              }}
            />
            <Box
              sx={{
                px: 2,
                py: 1.25,
                borderRadius: '0px 18px 18px 18px',
                bgcolor: isDark ? '#0f172a' : '#ffffff',
                border: `1px solid ${isDark ? 'rgba(147,51,234,0.4)' : 'rgba(147,51,234,0.35)'}`,
                display: 'flex',
                gap: 0.5,
                alignItems: 'center',
              }}
            >
              {[0, 1, 2].map(i => (
                <Box
                  key={i}
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    bgcolor: theme.palette.primary.main,
                    opacity: 0.7,
                    animation: 'pulse 1.4s ease-in-out infinite',
                    animationDelay: `${i * 0.2}s`,
                    '@keyframes pulse': {
                      '0%, 60%, 100%': { transform: 'translateY(0)', opacity: 0.4 },
                      '30%': { transform: 'translateY(-5px)', opacity: 1 },
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>
      )}

      <div ref={messagesEndRef} />
    </Box>
  )
}
