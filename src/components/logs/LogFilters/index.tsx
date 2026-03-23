import { Stack, Box } from '@mui/material'
import SearchInputWithTags from '@/components/logs/LogFilters/SearchInputWithTags'
import FilterTag from '@/components/logs/LogFilters/FilterTag'

interface LogFiltersProps {
  query: string
  onQueryChange: (value: string) => void
  onRefresh: () => void
  customFilters?: string[]
  onCustomFiltersChange?: (filters: string[]) => void
}

export default function LogFilters({
  query,
  onQueryChange,
  customFilters = [],
  onCustomFiltersChange = () => {},
}: LogFiltersProps) {
  return (
    <Stack spacing={1}>
      <SearchInputWithTags
        onFiltersChange={(filter) => {
          if (!customFilters.includes(filter)) {
            onCustomFiltersChange([...customFilters, filter])
          }
        }}
        onQueryChange={onQueryChange}
      />
      {customFilters.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {customFilters.map(filter => (
            <FilterTag
              key={filter}
              value={filter}
              onDelete={() => onCustomFiltersChange(customFilters.filter(f => f !== filter))}
            />
          ))}
        </Box>
      )}
    </Stack>
  )
}
