'use client'

import { useState } from 'react'
import {
  Box,
  Checkbox,
  Collapse,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import TimeRangeSelect from '@/components/logs/LogFilters/TimeRangeSelect'

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

interface FieldExplorerProps {
  onSectionChange: (prefix: string, values: string[]) => void
  filterOptions?: LogSourceFilterOptions
  timeRange: '15m' | '1h' | '6h' | '24h' | 'all'
  onTimeRangeChange: (value: '15m' | '1h' | '6h' | '24h' | 'all') => void
  selectedIndexes: string[]
  selectedServices: string[]
  selectedEnvs: string[]
  selectedLevels: string[]
  selectedHosts: string[]
}

function FilterSection({
  label,
  items,
  prefix,
  selected,
  onSelect,
}: {
  label: string
  items: string[]
  prefix: string
  selected: string[]
  onSelect: (prefix: string, values: string[]) => void
}) {
  const [open, setOpen] = useState(true)

  if (items.length === 0) return null

  const normalizedSelected = selected.length > 0 ? selected : items
  const allChecked = items.every(i => normalizedSelected.includes(i))

  const toggle = (item: string) => {
    let next: string[]
    if (item === 'All') {
      next = allChecked ? [] : [...items]
    } else {
      if (allChecked) {
        // All 선택 상태에서 개별 클릭 → 그 값만 선택
        next = [item]
      } else {
        next = normalizedSelected.includes(item)
          ? normalizedSelected.filter(s => s !== item)
          : [...normalizedSelected, item]
      }
    }
    onSelect(prefix, next.length === items.length ? [] : next)
  }

  return (
    <>
      <ListItemButton onClick={() => setOpen(o => !o)} sx={{ px: 1.5, py: 0.5 }}>
        <ListItemText
          primary={label}
          primaryTypographyProps={{ variant: 'caption', fontWeight: 700, color: 'text.secondary' }}
        />
        {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
      </ListItemButton>
      <Collapse in={open}>
        <List disablePadding>
          {['All', ...items].map(item => (
            <ListItemButton key={item} sx={{ px: 2.5, py: 0 }} onClick={() => toggle(item)}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Checkbox
                  size="small"
                  checked={item === 'All' ? allChecked : normalizedSelected.includes(item)}
                  disableRipple
                  sx={{ p: 0 }}
                />
              </ListItemIcon>
              <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2' }} />
            </ListItemButton>
          ))}
        </List>
      </Collapse>
      <Divider />
    </>
  )
}

export function FieldExplorer({
  onSectionChange,
  filterOptions,
  timeRange,
  onTimeRangeChange,
  selectedIndexes,
  selectedServices,
  selectedEnvs,
  selectedLevels,
  selectedHosts,
}: FieldExplorerProps) {
  const app = filterOptions?.['logs-app']
  const host = filterOptions?.['logs-host']

  const indexes = [...(app ? ['logs-app'] : []), ...(host ? ['logs-host'] : [])]
  const services = app?.services ?? []
  const envs = app?.envs ?? []
  const levels = [...new Set([...(app?.levels ?? []), ...(host?.levels ?? [])])]
  const hosts = [...new Set([...(app?.hosts ?? []), ...(host?.hosts ?? [])])]

  const handleSelect = (prefix: string, values: string[]) => {
    onSectionChange(prefix, values)
  }

  return (
    <Box
      sx={{ borderRight: { lg: '1px solid' }, borderColor: '#e2e8f0!important', overflowY: 'auto' }}
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: '#e2e8f0', display: 'flex' }}>
        <TimeRangeSelect value={timeRange} onChange={onTimeRangeChange} />
      </Box>
      <List disablePadding>
        <FilterSection
          label="INDEX"
          items={indexes}
          prefix="index"
          selected={selectedIndexes}
          onSelect={handleSelect}
        />
        <FilterSection
          label="SERVICE"
          items={services}
          prefix="service"
          selected={selectedServices}
          onSelect={handleSelect}
        />
        <FilterSection
          label="ENV"
          items={envs}
          prefix="env"
          selected={selectedEnvs}
          onSelect={handleSelect}
        />
        <FilterSection
          label="LEVEL"
          items={levels}
          prefix="level"
          selected={selectedLevels}
          onSelect={handleSelect}
        />
        <FilterSection
          label="HOST"
          items={hosts}
          prefix="host"
          selected={selectedHosts}
          onSelect={handleSelect}
        />
      </List>
    </Box>
  )
}
