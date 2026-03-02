'use client';

import React, { useState } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import GlobalFilterBar from './GlobalFilterBar';
import AiChatDrawer from '../chat/AiChatDrawer';
import { GlobalFilterState } from '@/lib/types';
import { defaultGlobalFilter } from '@/lib/mock';

interface AppLayoutProps {
  children: React.ReactNode;
}

const drawerWidth = 280;
const topBarHeight = 48;
const aiDrawerWidth = 400;

export default function AppLayout({ children }: AppLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<GlobalFilterState>(defaultGlobalFilter);
  const [aiChatOpen, setAiChatOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: '#0a0f1a', width: '100vw' }}>
      {/* Top AppBar */}
      <TopBar 
        onMenuClick={handleDrawerToggle}
        showMenuButton={isMobile}
      />

      {/* Desktop Sidebar */}
      {!isMobile && (
        <Box sx={{ width: drawerWidth, flexShrink: 0, display: 'flex', flexDirection: 'column', mt: `${topBarHeight}px` }}>
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
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        {/* GlobalFilterBar - fixed height, flexible width */}
        <GlobalFilterBar value={filters} onChange={setFilters} />

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
            {children}
          </Box>
        </Box>
      </Box>

      {/* AI Chat Drawer - fixed width */}
      <AiChatDrawer open={aiChatOpen} onClose={() => setAiChatOpen(false)} filters={filters} />
    </Box>
  );
}

