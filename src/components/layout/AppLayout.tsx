'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Box, useTheme, useMediaQuery } from '@mui/material'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import AiChatDrawer from '../chat/AiChatDrawer'
import { GlobalFilterState } from '@/lib/types'

interface AppLayoutProps {
  children: React.ReactNode
}

const drawerWidth = 280
const topBarHeight = 48

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [aiChatOpen, setAiChatOpen] = useState(false)
  const [filters] = useState<GlobalFilterState>({
    timeRange: '1h',
    startTime: Date.now() - 3600000,
    endTime: Date.now(),
    service: [],
    env: [],
    cluster: [],
  })

  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        bgcolor: 'background.default',
        width: '100%',
      }}
    >
      {/* Top AppBar */}
      <TopBar onMenuClick={handleDrawerToggle} showMenuButton={isMobile} />

      {/* Desktop Sidebar - md 이상만 표시 */}
      {!isMobile && (
        <Box
          sx={{
            width: drawerWidth,
            minWidth: drawerWidth,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            overflow: 'hidden',
          }}
        >
          <Sidebar onOpenAiChat={() => setAiChatOpen(true)} variant="permanent" />
        </Box>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Sidebar
          onOpenAiChat={() => setAiChatOpen(true)}
          variant="temporary"
          openMobile={mobileDrawerOpen}
          onCloseMobile={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Main Content Area - flexGrow takes remaining space */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          mt: `${topBarHeight}px`,
          height: `calc(100vh - ${topBarHeight}px)`,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        {/* Scrollable Content - flexGrow fills remaining height */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            px: { xs: 1.5, sm: 2, md: 3, lg: 4 },
            py: 3,
          }}
        >
          {/* Content wrapper - max width + centered */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              maxWidth: '1400px',
              mx: 'auto',
              width: '100%',
              minHeight: 0,
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>

      {/* AI Chat Drawer - fixed width */}
      <AiChatDrawer open={aiChatOpen} onClose={() => setAiChatOpen(false)} filters={filters} />
    </Box>
  )
}
