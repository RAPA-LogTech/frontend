'use client'

import { Box, Drawer, IconButton, Typography, useMediaQuery, useTheme } from '@mui/material'
import { Close as CloseIcon, SmartToy as BotIcon } from '@mui/icons-material'
import { useAiChat } from '@/app/providers'
import ChatMain from './ChatMain'

export default function AiChatDrawer() {
  const { drawerOpen, closeDrawer, drawerConversation, isLoading, sendMessage } = useAiChat()
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.down('sm')) // < 600
  const isSm = useMediaQuery(theme.breakpoints.down('md')) // < 900
  const drawerWidth = isXs ? '100vw' : isSm ? '85vw' : 520

  return (
    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={closeDrawer}
      variant="temporary"
      PaperProps={{
        sx: {
          width: drawerWidth,
          top: '48px',
          height: 'calc(100% - 48px)',
          bgcolor: 'background.default',
          borderLeft: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BotIcon sx={{ color: '#9333ea', fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            AI Assistant
          </Typography>
        </Box>
        <IconButton size="small" onClick={closeDrawer} sx={{ color: 'text.secondary' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Chat */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <ChatMain
          key={drawerConversation?.id ?? 'drawer-empty'}
          conversation={drawerConversation}
          onSendMessage={sendMessage}
          isLoading={isLoading}
          compactPrompts
        />
      </Box>
    </Drawer>
  )
}
