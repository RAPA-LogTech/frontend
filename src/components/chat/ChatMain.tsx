'use client'

import { useState, useEffect, useRef } from 'react'
import { Box } from '@mui/material'
import { AiConversation } from '@/lib/types'
import MessageArea, { SuggestedPrompt } from './MessageArea'
import ChatInput from './ChatInput'

interface ChatMainProps {
  conversation: AiConversation | null
  onSendMessage: (content: string) => void
  isLoading?: boolean
  suggestedPrompts?: SuggestedPrompt[]
}

export default function ChatMain({
  conversation,
  onSendMessage,
  isLoading = false,
  suggestedPrompts,
}: ChatMainProps) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isLoading) inputRef.current?.focus()
  }, [isLoading])

  const handleSend = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    setInputValue('')
    onSendMessage(trimmed)
  }

  const handlePromptClick = (prompt: string) => {
    onSendMessage(prompt)
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <MessageArea
        messages={conversation?.messages || []}
        isLoading={isLoading}
        suggestedPrompts={suggestedPrompts}
        onSuggestedPromptClick={handlePromptClick}
      />
      <ChatInput
        inputRef={inputRef}
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        disabled={isLoading}
      />
    </Box>
  )
}
