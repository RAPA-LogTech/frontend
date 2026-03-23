'use client'

import { useState, KeyboardEvent } from 'react'
import { Box, Stack, TextField, Button, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import FilterTag from './FilterTag'

interface SearchInputWithTagsProps {
  filters: string[]
  onFiltersChange: (filters: string[]) => void
  onQueryChange?: (query: string) => void
}

export default function SearchInputWithTags({
  filters,
  onFiltersChange,
  onQueryChange,
}: SearchInputWithTagsProps) {
  const [inputValue, setInputValue] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addFilter()
    }
  }

  const addFilter = () => {
    const trimmed = inputValue.trim()
    if (trimmed && !filters.includes(trimmed)) {
      onFiltersChange([...filters, trimmed])
      setInputValue('')
      if (onQueryChange) {
        onQueryChange('')
      }
    }
  }

  const deleteFilter = (filterToDelete: string) => {
    onFiltersChange(filters.filter(f => f !== filterToDelete))
  }

  return (
    <Stack spacing={1} sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>
        <TextField
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add filter (e.g., error, env:dev)"
          size="small"
          sx={{ flexGrow: 1 }}
        />
        <Button
          onClick={addFilter}
          variant="contained"
          size="small"
          sx={{
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
            gap: 0,
            minWidth: 0,
            paddingLeft: 1,
            paddingRight: 1,
            textTransform: 'none',
          }}
        >
          <AddIcon sx={{ width: '18px', height: '18px' }} />
          Add...
        </Button>
      </Box>
      {filters.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.5,
            bgcolor: 'background.default',
            p: 1,
            borderRadius: 1,
            border: 1,
            borderColor: 'divider',
          }}
        >
          {filters.map(filter => (
            <FilterTag key={filter} value={filter} onDelete={() => deleteFilter(filter)} />
          ))}
        </Box>
      )}
    </Stack>
  )
}
