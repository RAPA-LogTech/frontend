'use client'

import { useTheme } from '@mui/material/styles'
import { Box, Chip, FormControlLabel, Switch, Typography } from '@mui/material'
import { GlobalFilterState } from '@/lib/types'

interface ContextBarProps {
  filters: GlobalFilterState
  attachContext: boolean
  onToggleAttachContext: (value: boolean) => void
}

export default function ContextBar({ filters, attachContext, onToggleAttachContext }: ContextBarProps) {
  const theme = useTheme()

  const chipSx = {
    bgcolor: theme.palette.background.paper,
    borderColor: theme.palette.divider,
    color: theme.palette.text.secondary,
    fontSize: '0.75rem',
    height: 24,
    '& .MuiChip-label': {
      px: 1,
    },
  }

  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
        {filters.service.length > 0 && (
          <Chip
            label={`Service: ${filters.service[0]}`}
            size="small"
            variant="outlined"
            sx={chipSx}
          />
        )}
        <Chip
          label={`Time: ${filters.timeRange}`}
          size="small"
          variant="outlined"
          sx={chipSx}
        />
      </Box>

      <FormControlLabel
        control={
          <Switch
            checked={attachContext}
            onChange={e => onToggleAttachContext(e.target.checked)}
            size="small"
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: theme.palette.primary.main,
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                bgcolor: `${theme.palette.primary.main}50`,
              },
            }}
          />
        }
        label={<Typography variant="caption">컨텍스트 첨부</Typography>}
        sx={{
          color: theme.palette.text.secondary,
          ml: 'auto',
          '& .MuiFormControlLabel-label': {
            fontSize: '0.75rem',
          },
        }}
      />
    </Box>
  )
}
