'use client'

import { Button, ButtonProps } from '@mui/material'
import { Check as CheckIcon } from '@mui/icons-material'

interface LuceneToggleProps extends Omit<ButtonProps, 'onClick'> {
  value: boolean
  onChange: (value: boolean) => void
}

export default function LuceneToggle({ value, onChange, ...props }: LuceneToggleProps) {
  return (
    <Button
      size="small"
      variant={value ? 'contained' : 'outlined'}
      sx={{ whiteSpace: 'nowrap', px: 2 }}
      onClick={() => onChange(!value)}
      {...props}
    >
      Lucene {value ? 'ON' : 'OFF'}
    </Button>
  )
}
