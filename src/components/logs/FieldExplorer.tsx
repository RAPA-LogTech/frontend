'use client'

import { Box, Button, Chip, Divider, Stack, TextField, Typography } from '@mui/material'

interface FieldExplorerProps {
  fieldSearch: string
  onFieldSearchChange: (value: string) => void
  filteredFields: string[]
  onAppendFieldFilter: (field: string) => void
}

export function FieldExplorer({
  fieldSearch,
  onFieldSearchChange,
  filteredFields,
  onAppendFieldFilter,
}: FieldExplorerProps) {
  return (
    <Box sx={{ borderRight: { lg: '1px solid' }, borderColor: 'divider', p: 1.5 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
        Search these accounts
      </Typography>
      <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 2 }}>
        <Chip label="Benchmarks" size="small" />
        <Chip label="Jenkins Tests Logs" size="small" />
        <Chip label="LogTech Prod" size="small" />
      </Stack>

      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
        Field Explorer
      </Typography>
      <TextField
        placeholder="Search field names"
        size="small"
        fullWidth
        sx={{ mb: 1 }}
        value={fieldSearch}
        onChange={e => onFieldSearchChange(e.target.value)}
      />
      <Divider sx={{ my: 1 }} />
      <Stack gap={0.5} sx={{ maxHeight: 310, overflowY: 'auto' }}>
        {filteredFields.map(field => (
          <Button
            key={field}
            size="small"
            variant="text"
            onClick={() => onAppendFieldFilter(field)}
            sx={{
              justifyContent: 'flex-start',
              textTransform: 'none',
              color: 'text.secondary',
              px: 0.5,
              minHeight: 28,
            }}
          >
            {field}
          </Button>
        ))}
      </Stack>
    </Box>
  )
}
