'use client'

import { Button, ButtonProps } from '@mui/material'
import { Refresh as RefreshIcon } from '@mui/icons-material'

interface RefreshButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick: () => void
}

export default function RefreshButton({ onClick, ...props }: RefreshButtonProps) {
  return (
    <Button
      variant="contained"
      size="small"
      sx={{ whiteSpace: 'nowrap', px: 2 }}
      onClick={onClick}
      {...props}
    >
      <RefreshIcon />
    </Button>
  )
}
