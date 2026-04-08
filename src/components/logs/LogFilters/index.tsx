'use client'

import { useState, KeyboardEvent } from 'react'
import { Box, Chip, IconButton, InputBase } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import RefreshIcon from '@mui/icons-material/Refresh'

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
  onRefresh,
  customFilters = [],
  onCustomFiltersChange = () => {},
}: LogFiltersProps) {
  const [input, setInput] = useState(query)

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmed = input.trim()
      if (!trimmed) return
      if (!customFilters.includes(trimmed)) {
        onCustomFiltersChange([...customFilters, trimmed])
      }
      setInput('')
      onQueryChange('')
    }
    if (e.key === 'Escape') {
      setInput('')
      onQueryChange('')
    }
  }

  const removeFilter = (f: string) => onCustomFiltersChange(customFilters.filter(x => x !== f))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1,
        px: 1.5, py: 0.75,
        border: '1px solid', borderColor: 'divider',
        borderRadius: 1.5,
        bgcolor: 'background.default',
        '&:focus-within': { borderColor: 'primary.main', boxShadow: '0 0 0 2px rgba(99,102,241,0.15)' },
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}>
        <SearchIcon sx={{ color: 'text.secondary', fontSize: 18, flexShrink: 0 }} />
        <InputBase
          fullWidth
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Search logs… or type key:value + Enter to add filter'
          sx={{ fontSize: 13, '& input': { p: 0 } }}
        />
        {input && (
          <IconButton size="small" onClick={() => { setInput(''); onQueryChange('') }} sx={{ p: 0.25, color: 'text.secondary' }}>
            <CloseIcon sx={{ fontSize: 15 }} />
          </IconButton>
        )}
        <IconButton size="small" onClick={onRefresh} sx={{ p: 0.25, color: 'text.secondary', flexShrink: 0 }}>
          <RefreshIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {customFilters.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {customFilters.map(f => (
            <Chip
              key={f}
              label={f}
              size="small"
              onDelete={() => removeFilter(f)}
              sx={{
                height: 22, fontSize: 11, fontFamily: 'monospace',
                bgcolor: 'rgba(99,102,241,0.1)', color: '#818cf8',
                border: '1px solid rgba(99,102,241,0.3)',
                '& .MuiChip-deleteIcon': { fontSize: 13, color: '#818cf8' },
              }}
            />
          ))}
          <Chip
            label="clear all"
            size="small"
            onClick={() => onCustomFiltersChange([])}
            sx={{ height: 22, fontSize: 11, color: 'text.secondary', cursor: 'pointer' }}
          />
        </Box>
      )}
    </Box>
  )
}
