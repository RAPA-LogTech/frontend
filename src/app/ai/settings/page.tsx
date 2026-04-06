'use client'

import { useTheme } from '@mui/material/styles'
import { Box, Typography, Paper, Button } from '@mui/material'

export default function AiSettingsPage() {
  const theme = useTheme()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          AI Settings
        </Typography>
        <Typography variant="body2" sx={{ color: theme => theme.palette.text.secondary }}>
          Configure AI assistant behavior and settings
        </Typography>
      </Box>

      {/* Settings Content */}
      <Paper
        variant="outlined"
        sx={{
          borderColor: theme.palette.divider,
          bgcolor: theme.palette.background.paper,
          p: 4,
          textAlign: 'center',
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Coming Soon
        </Typography>
        <Typography variant="body2" sx={{ color: theme => theme.palette.text.secondary, mb: 3 }}>
          AI settings will be available here.
        </Typography>
        <Button variant="outlined" href="/ai/chat">
          Go to AI Chat
        </Button>
      </Paper>
    </Box>
  )
}
