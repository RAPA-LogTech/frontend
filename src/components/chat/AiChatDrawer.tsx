'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Drawer,
  Box,
  TextField,
  IconButton,
  Avatar,
  Chip,
  Paper,
  Typography,
  Stack,
  Skeleton,
} from '@mui/material'
import {
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as UserIcon,
} from '@mui/icons-material'
import { AiMessage, GlobalFilterState } from '@/lib/types'

interface AiChatDrawerProps {
  open: boolean
  onClose: () => void
  filters: GlobalFilterState
}

const aiDrawerWidth = 400

export const AiChatDrawer: React.FC<AiChatDrawerProps> = ({ open, onClose, filters }) => {
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim()) return

    // Add user message
    const userMessage: AiMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: Date.now(),
      context: {
        service: filters.service[0],
        timeRange: filters.timeRange,
      },
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      const assistantMessage: AiMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `This is a mock response to: "${inputValue}"\n\nIn production, this would be powered by an LLM with access to your observability data.`,
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsLoading(false)
    }, 800)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Overlay */}
      {open && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 39,
          }}
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: aiDrawerWidth,
            bgcolor: '#0f172a',
            borderLeft: '1px solid #1E293B',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BotIcon sx={{ color: '#c084fc', fontSize: 24 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#e2e8f0' }}>
              Observability AI
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{
              color: '#64748b',
              '&:hover': {
                bgcolor: '#1e293b',
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Context Info */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: '1px solid #1E293B',
          }}
        >
          <Typography variant="caption" sx={{ color: '#64748b', mb: 1, display: 'block' }}>
            Current Context
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {filters.service.length > 0 && (
              <Chip
                label={`Service: ${filters.service[0]}`}
                size="small"
                variant="outlined"
                sx={{
                  bgcolor: '#1e293b',
                  borderColor: '#334155',
                  color: '#cbd5e1',
                  fontSize: '0.75rem',
                }}
              />
            )}
            <Chip
              label={`Time: ${filters.timeRange}`}
              size="small"
              variant="outlined"
              sx={{
                bgcolor: '#1e293b',
                borderColor: '#334155',
                color: '#cbd5e1',
                fontSize: '0.75rem',
              }}
            />
          </Box>
        </Box>

        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {messages.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <Box sx={{ textAlign: 'center', color: '#64748b' }}>
                <Typography variant="caption">
                  👋 Hi! Ask me anything about your observability data.
                </Typography>
                <Typography variant="caption" display="block">
                  I can help with logs, traces, metrics, and alerts.
                </Typography>
              </Box>
            </Box>
          ) : (
            messages.map(msg => (
              <Box
                key={msg.id}
                sx={{
                  display: 'flex',
                  gap: 1,
                  alignItems: 'flex-start',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                {/* Avatar */}
                {msg.role === 'assistant' && (
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: '#1e293b',
                      color: '#cbd5e1',
                      flexShrink: 0,
                    }}
                  >
                    <BotIcon fontSize="small" />
                  </Avatar>
                )}

                {/* Message Bubble */}
                <Paper
                  variant="outlined"
                  sx={{
                    flex: 1,
                    maxWidth: '80%',
                    p: 1.5,
                    bgcolor: msg.role === 'user' ? 'rgba(147, 51, 234, 0.2)' : '#1e293b',
                    borderColor: msg.role === 'user' ? 'rgba(147, 51, 234, 0.3)' : '#334155',
                    color: '#e2e8f0',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.875rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.content}
                  </Typography>

                  {/* Action Links */}
                  {msg.metadata?.actionType && (
                    <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #334155' }}>
                      <Box
                        component="button"
                        onClick={() => {
                          console.log('Action:', msg.metadata)
                        }}
                        sx={{
                          fontSize: '0.75rem',
                          px: 1,
                          py: 0.5,
                          bgcolor: '#334155',
                          color: '#cbd5e1',
                          border: 'none',
                          borderRadius: 0.5,
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                          '&:hover': {
                            bgcolor: '#475569',
                          },
                        }}
                        title={`Go to ${msg.metadata.actionType}`}
                      >
                        → {msg.metadata.actionType.replace('_', ' ')}
                      </Box>
                    </Box>
                  )}
                </Paper>

                {/* User Avatar */}
                {msg.role === 'user' && (
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: '#9333ea',
                      color: '#fff',
                      flexShrink: 0,
                    }}
                  >
                    <UserIcon fontSize="small" />
                  </Avatar>
                )}
              </Box>
            ))
          )}

          {isLoading && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  bgcolor: '#1e293b',
                  color: '#cbd5e1',
                  flexShrink: 0,
                }}
              >
                <BotIcon fontSize="small" />
              </Avatar>
              <Paper
                variant="outlined"
                sx={{
                  flex: 1,
                  p: 1.5,
                  bgcolor: '#1e293b',
                  borderColor: '#334155',
                  color: '#cbd5e1',
                }}
              >
                <Box sx={{ fontSize: '0.875rem' }}>⏳ Thinking...</Box>
              </Paper>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        {/* Input */}
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid #1E293B',
            display: 'flex',
            gap: 1,
          }}
        >
          <TextField
            fullWidth
            placeholder="Ask me anything..."
            multiline
            maxRows={3}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            size="small"
            sx={{
              bgcolor: '#1e293b',
              '& .MuiOutlinedInput-root': {
                color: '#cbd5e1',
                '& fieldset': {
                  borderColor: '#334155',
                },
                '&:hover fieldset': {
                  borderColor: '#475569',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#c084fc',
                },
              },
            }}
          />
          <IconButton
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            sx={{
              color: '#64748b',
              '&:hover': {
                bgcolor: '#1e293b',
              },
              '&.Mui-disabled': {
                opacity: 0.5,
              },
            }}
            title="Send (Shift+Enter for new line)"
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Drawer>
    </>
  )
}

export default AiChatDrawer
