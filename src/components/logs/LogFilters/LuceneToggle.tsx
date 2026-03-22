'use client'

import { Button, ButtonProps, Tooltip } from '@mui/material'
import { Check as CheckIcon } from '@mui/icons-material'

interface LuceneToggleProps extends Omit<ButtonProps, 'onClick'> {
  value: boolean
  onChange: (value: boolean) => void
}

export default function LuceneToggle({ value, onChange, ...props }: LuceneToggleProps) {
  return (
    <Tooltip
      title={
        value
          ? 'Lucene 쿼리: field:value 형식 (예: service:auth-service, level:ERROR)'
          : '단순 텍스트 검색'
      }
    >
      <Button
        size="small"
        variant={value ? 'contained' : 'outlined'}
        sx={{ whiteSpace: 'nowrap', px: 2.5, minWidth: 110 }}
        onClick={() => onChange(!value)}
        {...props}
      >
        Lucene {value ? 'ON' : 'OFF'}
      </Button>
    </Tooltip>
  )
}
