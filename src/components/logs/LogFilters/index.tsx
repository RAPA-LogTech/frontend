'use client'

import { Stack } from '@mui/material'
import SearchInput from './SearchInput'
import LuceneToggle from './LuceneToggle'
import TimeRangeSelect from './TimeRangeSelect'
import RefreshButton from './RefreshButton'
import LiveButton from './LiveButton'

interface LogFiltersProps {
  query: string
  onQueryChange: (value: string) => void
  isLuceneMode: boolean
  onLuceneModeChange: (value: boolean) => void
  timeRange: '15m' | '1h' | '6h' | '24h' | 'all'
  onTimeRangeChange: (value: '15m' | '1h' | '6h' | '24h' | 'all') => void
  onRefresh: () => void
  isLiveEnabled: boolean
  onLiveEnabledChange: (value: boolean) => void
}

export default function LogFilters({
  query,
  onQueryChange,
  isLuceneMode,
  onLuceneModeChange,
  timeRange,
  onTimeRangeChange,
  onRefresh,
  isLiveEnabled,
  onLiveEnabledChange,
}: LogFiltersProps) {
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} gap={1}>
      <SearchInput value={query} onChange={onQueryChange} />
      <LuceneToggle value={isLuceneMode} onChange={onLuceneModeChange} />
      <TimeRangeSelect value={timeRange} onChange={onTimeRangeChange} />
      <RefreshButton onClick={onRefresh} />
      <LiveButton value={isLiveEnabled} onChange={onLiveEnabledChange} />
    </Stack>
  )
}
