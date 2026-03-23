'use client'

import { Chip, Box, SxProps, Theme } from '@mui/material'
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
      label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>{value}</Box>}
      onDelete={onDelete}
      deleteIcon={<CloseIcon sx={{ fontSize: 16 }} />}
      sx={{
        backgroundColor: isLuceneFormat ? 'warning.light' : 'info.light',
        color: isLuceneFormat ? 'warning.dark' : 'info.dark',
        borderColor: isLuceneFormat ? 'warning.main' : 'info.main',
        '& .MuiChip-deleteIcon': {
          margin: 0,
        },
        '&:hover': {
          backgroundColor: isLuceneFormat ? 'warning.light' : 'info.light',
        },
        ...sx,
      }}
      size="small"
    />
  )
}
