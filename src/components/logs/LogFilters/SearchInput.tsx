'use client'

import { TextField, TextFieldProps } from '@mui/material'

interface SearchInputProps extends Omit<TextFieldProps, 'onChange' | 'value'> {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search logs (Lucene style)',
  ...props
}: SearchInputProps) {
  return (
    <TextField
      fullWidth
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      size="small"
      {...props}
    />
  )
}
