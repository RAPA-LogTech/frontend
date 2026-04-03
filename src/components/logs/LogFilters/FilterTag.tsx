'use client'

import { Chip, SxProps, Theme } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

interface FilterTagProps {
  value: string
  onDelete: () => void
  sx?: SxProps<Theme>
}

export default function FilterTag({ value, onDelete, sx }: FilterTagProps) {
  // lucene 형태 (key:value) 체크
  const isLuceneFormat = value.includes(':')

  return (
    <Chip
      label={value}
      onDelete={onDelete}
      deleteIcon={<CloseIcon sx={{ fontSize: 16 }} />}
      sx={{
        display: 'inline-flex',
        width: 'auto',
        maxWidth: 'fit-content',
        alignSelf: 'flex-start',
        boxSizing: 'border-box',
        backgroundColor: isLuceneFormat ? 'warning.light' : 'info.light',
        color: isLuceneFormat ? 'warning.dark' : 'info.dark',
        borderColor: isLuceneFormat ? 'warning.main' : 'info.main',
        '&:hover': {
          backgroundColor: isLuceneFormat ? 'warning.light' : 'info.light',
        },
        ...sx,
      }}
      size="small"
    />
  )
}
