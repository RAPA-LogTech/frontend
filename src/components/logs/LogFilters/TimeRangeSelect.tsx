'use client'

import { FormControl, MenuItem, Select, SelectProps } from '@mui/material'

type TimeRange = '15m' | '1h' | '6h' | '24h' | 'all'

interface TimeRangeSelectProps extends Omit<SelectProps, 'onChange' | 'value'> {
  value: TimeRange
  onChange: (value: TimeRange) => void
}

const timeRangeOptions = [
  { value: '15m' as TimeRange, label: 'Last 15m' },
  { value: '1h' as TimeRange, label: 'Last 1h' },
  { value: '6h' as TimeRange, label: 'Last 6h' },
  { value: '24h' as TimeRange, label: 'Last 24h' },
  { value: 'all' as TimeRange, label: 'All Time' },
]

export default function TimeRangeSelect({ value, onChange, ...props }: TimeRangeSelectProps) {
  return (
    <FormControl size="small" sx={{ minWidth: 130 }}>
      <Select value={value} onChange={e => onChange(e.target.value as TimeRange)} {...props}>
        {timeRangeOptions.map(option => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
