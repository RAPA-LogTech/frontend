'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { CssBaseline, PaletteMode, ThemeProvider } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getAppTheme } from '@/theme/theme'
import { AiConversation, AiMessage, GlobalFilterState } from '@/lib/types'

const THEME_MODE_STORAGE_KEY = 'logtech-theme-mode'

const isValidPaletteMode = (value: string | null): value is PaletteMode => {
  return value === 'dark' || value === 'light'
}

const getInitialMode = (): PaletteMode => {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  const savedMode = localStorage.getItem(THEME_MODE_STORAGE_KEY)

  if (isValidPaletteMode(savedMode)) {
    return savedMode
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const getInitialHasUserPreference = () => {
  if (typeof window === 'undefined') {
    return false
  }

  return isValidPaletteMode(localStorage.getItem(THEME_MODE_STORAGE_KEY))
}

type ColorModeContextType = {
  mode: PaletteMode
  toggleMode: () => void
}

const ColorModeContext = createContext<ColorModeContextType | null>(null)

export const useColorMode = () => {
  const context = useContext(ColorModeContext)
  if (!context) {
    throw new Error('useColorMode must be used within AppProviders')
  }
  return context
}

const defaultFilters: GlobalFilterState = {
  timeRange: '1h',
  startTime: Date.now() - 3600000,
  endTime: Date.now(),
  service: [],
  env: [],
  cluster: [],
}

type FilterContextType = {
  filters: GlobalFilterState
  setFilters: (filters: GlobalFilterState) => void
  updateTimeRange: (timeRange: string) => void
}

const FilterContext = createContext<FilterContextType | null>(null)

export const useFilters = () => {
  const context = useContext(FilterContext)
  if (!context) {
    throw new Error('useFilters must be used within AppProviders')
  }
  return context
}

// ============ AiChat Context ============

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

type AiChatContextType = {
  drawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
  drawerConversation: AiConversation | null
  isLoading: boolean
  sendMessage: (content: string) => Promise<void>
}

const AiChatContext = createContext<AiChatContextType | null>(null)

export const useAiChat = () => {
  const context = useContext(AiChatContext)
  if (!context) throw new Error('useAiChat must be used within AppProviders')
  return context
}

const queryClient = new QueryClient()

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>(getInitialMode)
  const [filters, setFiltersState] = useState<GlobalFilterState>(defaultFilters)
  const [hasUserPreference, setHasUserPreference] = useState(getInitialHasUserPreference)
  const [isMounted, setIsMounted] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerConversation, setDrawerConversation] = useState<AiConversation | null>(null)
  const [isChatLoading, setIsChatLoading] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (hasUserPreference) {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      setMode(event.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [hasUserPreference])

  const toggleMode = () => {
    setMode(prev => {
      const nextMode = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem(THEME_MODE_STORAGE_KEY, nextMode)
      return nextMode
    })

    if (!hasUserPreference) {
      setHasUserPreference(true)
    }
  }

  const setFilters = (newFilters: GlobalFilterState) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }))
  }

  const updateTimeRange = (timeRange: string) => {
    const now = Date.now()
    let startTime = now
    let endTime = now

    switch (timeRange) {
      case '15m':
        startTime = now - 15 * 60 * 1000
        break
      case '1h':
        startTime = now - 60 * 60 * 1000
        break
      case '6h':
        startTime = now - 6 * 60 * 60 * 1000
        break
      case '24h':
        startTime = now - 24 * 60 * 60 * 1000
        break
      case '7d':
        startTime = now - 7 * 24 * 60 * 60 * 1000
        break
      default:
        break
    }

    setFiltersState(prev => ({ ...prev, timeRange, startTime, endTime }))
  }

  const sendMessage = useCallback(
    async (content: string) => {
      let cid = drawerConversation?.id ?? null

      if (!cid) {
        try {
          const res = await fetch('/api/chat/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: content }),
          })
          const conv = await res.json()
          const newConv = toAiConversation(conv)
          setDrawerConversation(newConv)
          cid = newConv.id
        } catch {
          return
        }
      }

      const tempUserMsg: AiMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content,
        timestamp: Date.now(),
      }
      setDrawerConversation(prev =>
        prev ? { ...prev, messages: [...prev.messages, tempUserMsg] } : prev
      )

      setIsChatLoading(true)
      try {
        const res = await fetch(`/api/chat/conversations/${cid}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: content }),
        })
        const data = await res.json()
        const assistantMsg = toAiMessage(data.message)
        setDrawerConversation(prev => {
          if (!prev) return prev
          const msgs = prev.messages.filter(m => m.id !== tempUserMsg.id)
          const userMsg: AiMessage = { ...tempUserMsg, id: `user-${Date.now()}` }
          return { ...prev, messages: [...msgs, userMsg, assistantMsg], updatedAt: Date.now() }
        })
      } catch {
        console.error('Failed to send message')
      } finally {
        setIsChatLoading(false)
      }
    },
    [drawerConversation]
  )

  const aiChatValue = useMemo(
    () => ({
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      drawerConversation,
      isLoading: isChatLoading,
      sendMessage,
    }),
    [drawerOpen, drawerConversation, isChatLoading, sendMessage]
  )

  const colorModeValue = useMemo(() => ({ mode, toggleMode }), [mode])
  const filterValue = useMemo(() => ({ filters, setFilters, updateTimeRange }), [filters])
  const theme = useMemo(() => getAppTheme(mode), [mode])

  if (!isMounted) {
    return null
  }

  return (
    <ColorModeContext.Provider value={colorModeValue}>
      <FilterContext.Provider value={filterValue}>
        <AiChatContext.Provider value={aiChatValue}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              {children}
            </ThemeProvider>
          </QueryClientProvider>
        </AiChatContext.Provider>
      </FilterContext.Provider>
    </ColorModeContext.Provider>
  )
}
