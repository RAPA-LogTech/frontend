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
  isLiveStreaming: boolean
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
  isLiveStreaming,
}: LogFiltersProps) {
  const getPlaceholder = (isLucene: boolean) =>
    isLucene ? 'field:value (예: service:auth, level:ERROR)' : '키워드 입력 (예: error, auth)'

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} gap={1}>
      <SearchInput
        value={query}
        onChange={onQueryChange}
        placeholder={getPlaceholder(isLuceneMode)}
        sx={{ width: { xs: '100%', md: 'auto' }, flexGrow: { md: 1 } }}
      />
      <Stack
        direction="row"
        gap={1}
        alignItems="center"
        flexShrink={0}
        justifyContent="space-between"
      >
        <LuceneToggle value={isLuceneMode} onChange={onLuceneModeChange} />
        <TimeRangeSelect value={timeRange} onChange={onTimeRangeChange} />
        <RefreshButton onClick={onRefresh} />
        <LiveButton
          value={isLiveEnabled}
          isStreaming={isLiveStreaming}
          onChange={onLiveEnabledChange}
        />
      </Stack>
    </Stack>
  )
}
