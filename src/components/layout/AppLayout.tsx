'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Box, useTheme, useMediaQuery } from '@mui/material'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import GlobalFilterBar from './GlobalFilterBar'
import AiChatDrawer from '../chat/AiChatDrawer'
import { GlobalFilterState } from '@/lib/types'
import { defaultGlobalFilter } from '@/lib/mock'

interface AppLayoutProps {
  children: React.ReactNode
}

const drawerWidth = 280
const topBarHeight = 48
const aiDrawerWidth = 400

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [filters, setFilters] = useState<GlobalFilterState>(defaultGlobalFilter)
  const [aiChatOpen, setAiChatOpen] = useState(false)

  const showGlobalFilterBar = pathname === '/traces' || pathname === '/metrics'

  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        bgcolor: 'background.default', // ← dynamic (dark: #0a0f1a, light: #f8fafc)
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
          ml: !isMobile ? `${drawerWidth}px` : 0,
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
              maxWidth: '1400px',
              mx: 'auto',
              width: '100%',
            }}
          >
            {showGlobalFilterBar ? (
              <Box sx={{ mb: 2 }}>
                <GlobalFilterBar value={filters} onChange={setFilters} />
              </Box>
            ) : null}
            {children}
          </Box>
        </Box>
      </Box>

      {/* AI Chat Drawer - fixed width */}
      <AiChatDrawer open={aiChatOpen} onClose={() => setAiChatOpen(false)} filters={filters} />
    </Box>
  )
}
