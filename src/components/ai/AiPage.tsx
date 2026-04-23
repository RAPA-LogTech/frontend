'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@mui/material/styles'
import { Box, Paper, Typography } from '@mui/material'
import { AiConversation, AiMessage } from '@/lib/types'
import ChatSidebar from '@/components/chat/ChatSidebar'
import ChatMain from '@/components/chat/ChatMain'

function toAiConversation(
  conv: { id: string; title: string; created_at: string; updated_at: string },
  messages: AiMessage[] = []
): AiConversation {
  return {
    id: conv.id,
    title: conv.title,
    messages,
    startedAt: new Date(conv.created_at).getTime(),
    updatedAt: new Date(conv.updated_at).getTime(),
  }
}

function toAiMessage(msg: {
  id: string
  role: string
  content: string
  created_at: string
}): AiMessage {
  return {
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    timestamp: new Date(msg.created_at).getTime(),
  }
}

export default function AiPage() {
  const theme = useTheme()
  const [conversations, setConversations] = useState<AiConversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/conversations')
      const data = await res.json()
      setConversations(
        (data as { id: string; title: string; created_at: string; updated_at: string }[]).map(c =>
          toAiConversation(c)
        )
      )
    } catch {
      console.error('Failed to load conversations')
    }
  }, [])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const activeConversation = conversations.find(c => c.id === activeConversationId)

  const handleSelectConversation = async (id: string) => {
    setActiveConversationId(id)
    const existing = conversations.find(c => c.id === id)
    if (existing && existing.messages.length === 0) {
      setIsLoadingMessages(true)
      try {
        const res = await fetch(`/api/chat/conversations/${id}`)
        const data = await res.json()
        setConversations(prev =>
          prev.map(c =>
            c.id === id
              ? {
                  ...c,
                  messages: (
                    data.messages as {
                      id: string
                      role: string
                      content: string
                      created_at: string
                    }[]
                  ).map(toAiMessage),
                }
              : c
          )
        )
      } catch {
        console.error('Failed to load messages')
      } finally {
        setIsLoadingMessages(false)
      }
    }
  }

  const handleCreateNew = () => {
    setActiveConversationId(null)
  }

  const handleDeleteConversation = async (id: string) => {
    try {
      await fetch(`/api/chat/conversations/${id}`, { method: 'DELETE' })
      setConversations(prev => prev.filter(c => c.id !== id))
      if (activeConversationId === id) setActiveConversationId(null)
    } catch {
      console.error('Failed to delete conversation')
    }
  }

  const handleSendMessage = async (content: string) => {
    let cid = activeConversationId

    if (!cid) {
      try {
        const res = await fetch('/api/chat/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: content }),
        })
        const conv = await res.json()
        const newConv = toAiConversation(conv)
        setConversations(prev => [newConv, ...prev])
        setActiveConversationId(newConv.id)
        cid = newConv.id
      } catch {
        console.error('Failed to create conversation')
        return
      }
    }

    const tempUserMsg: AiMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    }
    setConversations(prev =>
      prev.map(c =>
        c.id === cid ? { ...c, messages: [...c.messages, tempUserMsg], updatedAt: Date.now() } : c
      )
    )

    setIsLoading(true)
    try {
      const res = await fetch(`/api/chat/conversations/${cid}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      })
      const data = await res.json()
      const assistantMsg = toAiMessage(data.message)

      setConversations(prev =>
        prev.map(c => {
          if (c.id !== cid) return c
          const msgs = c.messages.filter(m => m.id !== tempUserMsg.id)
          const userMsg: AiMessage = { ...tempUserMsg, id: `user-${Date.now()}` }
          return { ...c, messages: [...msgs, userMsg, assistantMsg], updatedAt: Date.now() }
        })
      )
    } catch {
      console.error('Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 1.5, sm: 2, md: 3 },
        height: '100%',
      }}
    >
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          AI Assistant
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          Ask questions about your observability data
        </Typography>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          borderColor: theme.palette.divider,
          bgcolor: theme.palette.background.paper,
          overflow: 'hidden',
          display: 'flex',
          flex: 1,
          minHeight: 0,
        }}
      >
        {conversations.length > 0 && (
          <ChatSidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onCreateNew={handleCreateNew}
            onDeleteConversation={handleDeleteConversation}
          />
        )}
        <ChatMain
          key={activeConversation?.id ?? 'empty'}
          conversation={activeConversation || null}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          isLoadingMessages={isLoadingMessages}
        />
      </Paper>
    </Box>
  )
}
