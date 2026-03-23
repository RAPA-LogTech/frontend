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
  onAppendFieldFilter: (field: string) => void
  filterOptions?: LogSourceFilterOptions
  timeRange: '15m' | '1h' | '6h' | '24h' | 'all'
  onTimeRangeChange: (value: '15m' | '1h' | '6h' | '24h' | 'all') => void
}

function FilterSection({
  label,
  items,
  prefix,
  onSelect,
}: {
  label: string
  items: string[]
  prefix: string
  onSelect: (values: string[]) => void
}) {
  const [open, setOpen] = useState(true)
  const [selected, setSelected] = useState<string[]>(items)

  if (items.length === 0) return null

  const allChecked = items.every(i => selected.includes(i))

  const toggle = (item: string) => {
    let next: string[]
    if (item === 'All') {
      next = allChecked ? [] : [...items]
    } else {
      if (allChecked) {
        // All 선택 상태에서 개별 클릭 → 그 값만 선택
        next = [item]
      } else {
        next = selected.includes(item) ? selected.filter(s => s !== item) : [...selected, item]
      }
    }
    setSelected(next)
    onSelect(next.map(v => `${prefix}:${v}`))
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
                  checked={item === 'All' ? allChecked : selected.includes(item)}
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
  onAppendFieldFilter,
  filterOptions,
  timeRange,
  onTimeRangeChange,
}: FieldExplorerProps) {
  const app = filterOptions?.['logs-app']
  const host = filterOptions?.['logs-host']

  const indexes = [...(app ? ['logs-app'] : []), ...(host ? ['logs-host'] : [])]
  const services = app?.services ?? []
  const envs = app?.envs ?? []
  const levels = [...new Set([...(app?.levels ?? []), ...(host?.levels ?? [])])]
  const hosts = [...new Set([...(app?.hosts ?? []), ...(host?.hosts ?? [])])]

  const handleSelect = (values: string[]) => {
    values.forEach(v => onAppendFieldFilter(v))
  }

  return (
    <Box
      sx={{ borderRight: { lg: '1px solid' }, borderColor: '#e2e8f0!important', overflowY: 'auto' }}
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: '#e2e8f0', display: 'flex' }}>
        <TimeRangeSelect value={timeRange} onChange={onTimeRangeChange} />
      </Box>
      <List disablePadding>
        <FilterSection label="INDEX" items={indexes} prefix="index" onSelect={handleSelect} />
        <FilterSection label="SERVICE" items={services} prefix="service" onSelect={handleSelect} />
        <FilterSection label="ENV" items={envs} prefix="env" onSelect={handleSelect} />
        <FilterSection label="LEVEL" items={levels} prefix="level" onSelect={handleSelect} />
        <FilterSection label="HOST" items={hosts} prefix="host" onSelect={handleSelect} />
      </List>
    </Box>
  )
}
