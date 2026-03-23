'use client'

import { useState, KeyboardEvent } from 'react'
import { Box, TextField, Button } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'

interface SearchInputWithTagsProps {
  onFiltersChange: (filter: string) => void
  onQueryChange?: (query: string) => void
}

export default function SearchInputWithTags({
  onFiltersChange,
  onQueryChange,
}: SearchInputWithTagsProps) {
  const [inputValue, setInputValue] = useState('')

  const addFilter = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    onFiltersChange(trimmed)
    setInputValue('')
    onQueryChange?.('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addFilter()
    }
  }

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexGrow: 1 }}>
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
        sx={{ minWidth: 0, px: 1, textTransform: 'none', gap: 0 }}
      >
        <AddIcon sx={{ width: 18, height: 18 }} />
        Add
      </Button>
    </Box>
  )
}
