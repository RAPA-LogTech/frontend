'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { CssBaseline, PaletteMode, ThemeProvider } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getAppTheme } from '@/theme/theme'
import { GlobalFilterState } from '@/lib/types'

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

const queryClient = new QueryClient()

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>(getInitialMode)
  const [filters, setFiltersState] = useState<GlobalFilterState>(defaultFilters)
  const [hasUserPreference, setHasUserPreference] = useState(getInitialHasUserPreference)
  const [isMounted, setIsMounted] = useState(false)

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

  const colorModeValue = useMemo(() => ({ mode, toggleMode }), [mode])
  const filterValue = useMemo(() => ({ filters, setFilters, updateTimeRange }), [filters])
  const theme = useMemo(() => getAppTheme(mode), [mode])

  if (!isMounted) {
    return null
  }

  return (
    <ColorModeContext.Provider value={colorModeValue}>
      <FilterContext.Provider value={filterValue}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </QueryClientProvider>
      </FilterContext.Provider>
    </ColorModeContext.Provider>
  )
}
