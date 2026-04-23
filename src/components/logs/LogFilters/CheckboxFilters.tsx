import { Checkbox, FormControlLabel, FormGroup, Stack, Typography, Box } from '@mui/material'
import React from 'react'

interface CheckboxFiltersProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
}

export default function CheckboxFilters({
  label,
  options,
  selected,
  onChange,
}: CheckboxFiltersProps) {
  // "All" 단일 선택 로직
  const handleChange = (option: string) => {
    if (option === 'All') {
      onChange(['All'])
    } else {
      const next = selected.includes(option) ? selected.filter(v => v !== option) : [option]
      onChange(next.length === 0 ? ['All'] : next)
    }
  }
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', whiteSpace: 'nowrap', fontWeight: 500 }}
      >
        {label}
      </Typography>
      <Stack direction="row" gap={0.5} alignItems="center">
        {options.map(option => (
          <FormControlLabel
            key={option}
            control={
              <Checkbox
                checked={selected.includes(option)}
                onChange={() => handleChange(option)}
                disabled={option !== 'All' && selected.includes('All')}
                size="small"
                sx={{ py: 0 }}
              />
            }
            label={
              <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                {option}
              </Typography>
            }
            sx={{ mr: 0.5, ml: 0 }}
          />
        ))}
      </Stack>
    </Box>
  )
}
