'use client'

import { Box, Drawer, IconButton, Typography } from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { formatDateTime } from '@/lib/formatters'
import { LogEntry } from '@/lib/types'

interface LogDetailDrawerProps {
  selectedLog: LogEntry | null
  onClose: () => void
}

export function LogDetailDrawer({ selectedLog, onClose }: LogDetailDrawerProps) {
  return (
    <Drawer
      anchor="right"
      open={selectedLog !== null}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 384,
          bgcolor: theme => theme.palette.background.paper,
          borderLeft: '1px solid',
          borderColor: theme => theme.palette.divider,
        },
      }}
    >
      {selectedLog && (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Log Detail
            </Typography>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{ color: theme => theme.palette.text.secondary }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Typography variant="body2" sx={{ color: theme => theme.palette.text.secondary }}>
            ID: {selectedLog.id}
          </Typography>
          <Typography variant="body2" sx={{ color: theme => theme.palette.text.secondary }}>
            Timestamp: {formatDateTime(selectedLog.timestamp)}
          </Typography>
          <Typography variant="body2" sx={{ color: theme => theme.palette.text.secondary }}>
            Service: {selectedLog.service}
          </Typography>
          <Typography variant="body2" sx={{ color: theme => theme.palette.text.secondary }}>
            Level: {selectedLog.level}
          </Typography>
          <Typography variant="body2" sx={{ color: theme => theme.palette.text.secondary }}>
            Message: {selectedLog.message}
          </Typography>
        </Box>
      )}
    </Drawer>
  )
}
