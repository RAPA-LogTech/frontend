'use client'

import { useState } from 'react'
import {
  Box,
  Chip,
  Collapse,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'

const LEVEL_COLORS: Record<string, { bg: string; color: string }> = {
  ERROR: { bg: 'rgba(248,113,113,0.15)', color: '#f87171' },
  WARN: { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24' },
  INFO: { bg: 'rgba(96,165,250,0.15)', color: '#60a5fa' },
  DEBUG: { bg: 'rgba(52,211,153,0.15)', color: '#34d399' },
  UNKNOWN: { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
}

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
  const [open, setOpen] = useState(false)
  if (items.length === 0) return null

  const normalizedSelected = selected.length > 0 ? selected : items
  const allChecked = items.every(i => normalizedSelected.includes(i))
  const activeCount = allChecked ? items.length : normalizedSelected.length

  const toggle = (item: string) => {
    let next: string[]
    if (item === '__all__') {
      next = allChecked ? [] : [...items]
    } else {
      next = allChecked
        ? [item]
        : normalizedSelected.includes(item)
          ? normalizedSelected.filter(s => s !== item)
          : [...normalizedSelected, item]
    }
    onSelect(prefix, next.length === items.length ? [] : next)
  }

  const isLevel = prefix === 'level'

  return (
    <>
      <ListItemButton onClick={() => setOpen(o => !o)} sx={{ px: 1.5, py: 0.75 }}>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 0.5 }}
              >
                {label}
              </Typography>
              {!allChecked && (
                <Chip
                  label={activeCount}
                  size="small"
                  sx={{
                    height: 16,
                    fontSize: 10,
                    fontWeight: 700,
                    bgcolor: 'primary.main',
                    color: '#fff',
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
              )}
            </Box>
          }
        />
        {open ? (
          <ExpandLess fontSize="small" sx={{ color: 'text.secondary' }} />
        ) : (
          <ExpandMore fontSize="small" sx={{ color: 'text.secondary' }} />
        )}
      </ListItemButton>

      <Collapse in={open}>
        <List disablePadding sx={{ px: 1, pb: 0.5 }}>
          {/* All 토글 */}
          <ListItemButton
            onClick={() => toggle('__all__')}
            sx={{
              borderRadius: 1,
              px: 1,
              py: 0.4,
              mb: 0.25,
              bgcolor: allChecked ? 'action.selected' : 'transparent',
            }}
          >
            <Typography
              variant="caption"
              sx={{ fontWeight: 600, color: allChecked ? 'text.primary' : 'text.secondary' }}
            >
              All ({items.length})
            </Typography>
          </ListItemButton>

          {items.map(item => {
            const isSelected = normalizedSelected.includes(item)
            const levelCfg = isLevel
              ? (LEVEL_COLORS[item.toUpperCase()] ?? LEVEL_COLORS.UNKNOWN)
              : null

            return (
              <ListItemButton
                key={item}
                onClick={() => toggle(item)}
                sx={{
                  borderRadius: 1,
                  px: 1,
                  py: 0.35,
                  mb: 0.2,
                  bgcolor: isSelected && !allChecked ? 'action.selected' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    gap: 1,
                  }}
                >
                  {levelCfg ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: levelCfg.color,
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: isSelected && !allChecked ? 700 : 500,
                          color: isSelected && !allChecked ? levelCfg.color : 'text.secondary',
                        }}
                      >
                        {item}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: isSelected && !allChecked ? 700 : 400,
                        color: isSelected && !allChecked ? 'text.primary' : 'text.secondary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item}
                    </Typography>
                  )}
                  {isSelected && !allChecked && (
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: levelCfg?.color ?? 'primary.main',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </Box>
              </ListItemButton>
            )
          })}
        </List>
      </Collapse>
      <Divider />
    </>
  )
}

export function FieldExplorer({
  onSectionChange,
  filterOptions,
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

  return (
    <Box
      sx={{ borderRight: { lg: '1px solid' }, borderColor: { lg: 'divider' }, overflowY: 'auto' }}
    >
      <List disablePadding>
        <FilterSection
          label="INDEX"
          items={indexes}
          prefix="index"
          selected={selectedIndexes}
          onSelect={onSectionChange}
        />
        <FilterSection
          label="SERVICE"
          items={services}
          prefix="service"
          selected={selectedServices}
          onSelect={onSectionChange}
        />
        <FilterSection
          label="ENV"
          items={envs}
          prefix="env"
          selected={selectedEnvs}
          onSelect={onSectionChange}
        />
        <FilterSection
          label="LEVEL"
          items={levels}
          prefix="level"
          selected={selectedLevels}
          onSelect={onSectionChange}
        />
        <FilterSection
          label="HOST"
          items={hosts}
          prefix="host"
          selected={selectedHosts}
          onSelect={onSectionChange}
        />
      </List>
    </Box>
  )
}
