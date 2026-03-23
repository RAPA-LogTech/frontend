import { Stack, Box, Typography } from '@mui/material'
import TimeRangeSelect from '@/components/logs/LogFilters/TimeRangeSelect'
import LiveButton from '@/components/logs/LogFilters/LiveButton'
import CheckboxFilters from '@/components/logs/LogFilters/CheckboxFilters'
import SearchInputWithTags from '@/components/logs/LogFilters/SearchInputWithTags'

type LogSource = 'all' | 'app' | 'host'

type FilterOptions = {
  services?: string[]
  envs?: string[]
  levels?: string[]
  hosts?: string[]
}

type LogSourceFilterOptions = {
  'logs-app'?: FilterOptions
  'logs-host'?: FilterOptions
}

interface LogFiltersProps {
  query: string
  onQueryChange: (value: string) => void
  timeRange: '15m' | '1h' | '6h' | '24h' | 'all'
  onTimeRangeChange: (value: '15m' | '1h' | '6h' | '24h' | 'all') => void
  onRefresh: () => void
  isLiveEnabled: boolean
  onLiveEnabledChange: (value: boolean) => void
  isLiveStreaming: boolean
  logSource: LogSource
  onLogSourceChange: (value: LogSource) => void
  filterOptions?: LogSourceFilterOptions
  selectedServices: string[]
  onSelectedServicesChange: (selected: string[]) => void
  selectedEnvs: string[]
  onSelectedEnvsChange: (selected: string[]) => void
  selectedLevels: string[]
  onSelectedLevelsChange: (selected: string[]) => void
  selectedHosts?: string[]
  onSelectedHostsChange?: (selected: string[]) => void
  customFilters?: string[]
  onCustomFiltersChange?: (filters: string[]) => void
}

export default function LogFilters({
  query,
  onQueryChange,
  timeRange,
  onTimeRangeChange,
  onRefresh,
  isLiveEnabled,
  onLiveEnabledChange,
  isLiveStreaming,
  logSource,
  onLogSourceChange,
  filterOptions,
  selectedServices,
  onSelectedServicesChange,
  selectedEnvs,
  onSelectedEnvsChange,
  selectedLevels,
  onSelectedLevelsChange,
  selectedHosts = ['All'],
  onSelectedHostsChange = () => {},
  customFilters = [],
  onCustomFiltersChange = () => {},
}: LogFiltersProps) {
  // logSource에 따른 필터 옵션 선택
  const getAppFilters = () => filterOptions?.['logs-app']
  const getHostFilters = () => filterOptions?.['logs-host']

  const appFilters = getAppFilters()
  const hostFilters = getHostFilters()

  // All Logs: 모든 필터 표시
  // App Logs: service, env, level 표시
  // Host Logs: host, env, level 표시
  const showAppFilters = logSource === 'all' || logSource === 'app'
  const showHostFilters = logSource === 'all' || logSource === 'host'

  const services = appFilters?.services ?? []
  const envs = showAppFilters ? (appFilters?.envs ?? []) : (hostFilters?.envs ?? [])
  const levels = showAppFilters ? (appFilters?.levels ?? []) : (hostFilters?.levels ?? [])
  const hosts = hostFilters?.hosts ?? []

  // 옵션에 'All' 추가
  const servicesWithAll = ['All', ...services.filter(s => s !== 'All')]
  const envsWithAll = ['All', ...envs.filter(e => e !== 'All')]
  const levelsWithAll = ['All', ...levels.filter(l => l !== 'All')]
  const hostsWithAll = ['All', ...hosts.filter(h => h !== 'All')]

  return (
    <Stack spacing={1}>
      {/* 첫 번째 라인: 검색 + 체크박스 필터 + TimeRange + Live */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 1,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <SearchInputWithTags
          filters={customFilters}
          onFiltersChange={onCustomFiltersChange}
          onQueryChange={onQueryChange}
          sx={{ flexGrow: { md: 1 } }}
        />
        {showAppFilters && servicesWithAll.length > 1 && (
          <CheckboxFilters
            label="Service"
            options={servicesWithAll}
            selected={selectedServices}
            onChange={onSelectedServicesChange}
          />
        )}
        {envsWithAll.length > 1 && (
          <CheckboxFilters
            label="Environment"
            options={envsWithAll}
            selected={selectedEnvs}
            onChange={onSelectedEnvsChange}
          />
        )}
        {levelsWithAll.length > 1 && (
          <CheckboxFilters
            label="Level"
            options={levelsWithAll}
            selected={selectedLevels}
            onChange={onSelectedLevelsChange}
          />
        )}
        {showHostFilters && hostsWithAll.length > 1 && (
          <CheckboxFilters
            label="Host"
            options={hostsWithAll}
            selected={selectedHosts}
            onChange={onSelectedHostsChange}
          />
        )}
        <TimeRangeSelect value={timeRange} onChange={onTimeRangeChange} />
        <LiveButton
          value={isLiveEnabled}
          onChange={onLiveEnabledChange}
          isStreaming={isLiveStreaming}
        />
      </Box>

      {/* 두 번째 라인: 커스텀 필터 태그들 */}
      {customFilters.length > 0 && (
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5 }}>
            Active Filters:
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            {customFilters.map(filter => {
              const isLuceneFormat = filter.includes(':')
              return (
                <Box
                  key={filter}
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    border: 1,
                    borderColor: '#e0e0e9',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    cursor: 'pointer',
                    fontFamily:
                      'SF Pro, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                    fontSize: '0.75rem',
                    '&:hover': { backgroundColor: '#f5f5f5' },
                  }}
                  onClick={() => {
                    onCustomFiltersChange(customFilters.filter(f => f !== filter))
                  }}
                >
                  {filter}
                </Box>
              )
            })}
          </Stack>
        </Box>
      )}
    </Stack>
  )
}
