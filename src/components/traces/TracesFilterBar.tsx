'use client'

import { Box, Chip, MenuItem, Paper, Select, Stack, Typography } from '@mui/material'
import type { Trace } from '@/lib/types'

interface Props {
  traces: Trace[]
  filterService: string
  filterOperation: string
  filterStatus: string
  filterEnvironment: string
  serviceList: string[]
  operationList: string[]
  statusList: string[]
  environmentList: string[]
  onFilterService: (v: string) => void
  onFilterOperation: (v: string) => void
  onFilterStatus: (v: string) => void
  onFilterEnvironment: (v: string) => void
}

const STATUS_COLORS: Record<string, string> = {
  ok: '#4ade80',
  error: '#f87171',
  slow: '#fbbf24',
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  colorMap,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
  colorMap?: Record<string, string>
}) {
  const isActive = value !== 'all'
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 10, letterSpacing: 0.5 }}
      >
        {label} ({options.length})
      </Typography>
      <Select
        value={value}
        onChange={e => onChange(e.target.value)}
        size="small"
        sx={{
          fontSize: 12,
          minWidth: 120,
          bgcolor: isActive ? 'rgba(99,102,241,0.08)' : 'background.paper',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: isActive ? '#818cf8' : 'divider',
          },
        }}
      >
        <MenuItem value="all" sx={{ fontSize: 12 }}>
          All
        </MenuItem>
        {options.map(opt => (
          <MenuItem key={opt} value={opt} sx={{ fontSize: 12 }}>
            <Stack direction="row" alignItems="center" gap={0.75}>
              {colorMap?.[opt] && (
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    bgcolor: colorMap[opt],
                    flexShrink: 0,
                  }}
                />
              )}
              {opt}
            </Stack>
          </MenuItem>
        ))}
      </Select>
    </Box>
  )
}

export default function TracesFilterBar({
  filterService,
  filterOperation,
  filterStatus,
  filterEnvironment,
  serviceList,
  operationList,
  statusList,
  environmentList,
  onFilterService,
  onFilterOperation,
  onFilterStatus,
  onFilterEnvironment,
}: Props) {
  const activeFilters = [
    filterService !== 'all' && {
      label: `service: ${filterService}`,
      clear: () => onFilterService('all'),
    },
    filterOperation !== 'all' && {
      label: `op: ${filterOperation}`,
      clear: () => onFilterOperation('all'),
    },
    filterStatus !== 'all' && {
      label: `status: ${filterStatus}`,
      clear: () => onFilterStatus('all'),
    },
    filterEnvironment !== 'all' && {
      label: `env: ${filterEnvironment}`,
      clear: () => onFilterEnvironment('all'),
    },
  ].filter(Boolean) as { label: string; clear: () => void }[]

  return (
    <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
        <FilterSelect
          label="SERVICE"
          value={filterService}
          options={serviceList}
          onChange={onFilterService}
        />
        <FilterSelect
          label="OPERATION"
          value={filterOperation}
          options={operationList}
          onChange={onFilterOperation}
        />
        <FilterSelect
          label="STATUS"
          value={filterStatus}
          options={statusList}
          onChange={onFilterStatus}
          colorMap={STATUS_COLORS}
        />
        <FilterSelect
          label="ENVIRONMENT"
          value={filterEnvironment}
          options={environmentList}
          onChange={onFilterEnvironment}
        />

        {activeFilters.length > 0 && (
          <Box
            sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center', ml: 'auto' }}
          >
            {activeFilters.map(f => (
              <Chip
                key={f.label}
                label={f.label}
                size="small"
                onDelete={f.clear}
                sx={{
                  height: 22,
                  fontSize: 11,
                  fontFamily: 'monospace',
                  bgcolor: 'rgba(99,102,241,0.1)',
                  color: '#818cf8',
                  border: '1px solid rgba(99,102,241,0.3)',
                  '& .MuiChip-deleteIcon': { fontSize: 13, color: '#818cf8' },
                }}
              />
            ))}
            <Chip
              label="clear all"
              size="small"
              onClick={() => {
                onFilterService('all')
                onFilterOperation('all')
                onFilterStatus('all')
                onFilterEnvironment('all')
              }}
              sx={{ height: 22, fontSize: 11, color: 'text.secondary', cursor: 'pointer' }}
            />
          </Box>
        )}
      </Box>
    </Paper>
  )
}
