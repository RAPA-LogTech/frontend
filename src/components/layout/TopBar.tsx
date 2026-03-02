'use client';

import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
  Chip,
  Box,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Menu as MenuIcon,
  Brightness4 as Brightness4Icon,
} from '@mui/icons-material';
import { useColorMode } from '@/app/providers';

const drawerWidth = 280;
const topBarHeight = 48;

interface TopBarProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export default function TopBar({ onMenuClick, showMenuButton = false }: TopBarProps) {
  const { mode, toggleMode } = useColorMode();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setShowUserMenu(true);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setShowUserMenu(false);
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        height: `${topBarHeight}px`,
        width: '100%',
        bgcolor: '#0f172a',
        borderBottom: '1px solid #1E293B',
        boxShadow: 'none',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar
        sx={{
          minHeight: `${topBarHeight}px !important`,
          height: `${topBarHeight}px`,
          display: 'flex',
          justifyContent: 'space-between',
          py: 1,
          px: { xs: 1, sm: 2 },
        }}
      >
        {/* Mobile Menu Button */}
        {showMenuButton && (
          <Tooltip title="Menu">
            <IconButton
              onClick={onMenuClick}
              size="small"
              sx={{
                color: '#64748b',
                '&:hover': {
                  color: '#cbd5e1',
                },
                mr: 1,
              }}
            >
              <MenuIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Left */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#e2e8f0' }}>
            Observability Console
          </Typography>
          <Chip
            label="Live"
            size="small"
            sx={{
              bgcolor: '#10b98150',
              color: '#10b981',
              fontWeight: 'bold',
            }}
          />
        </Box>

        {/* Right */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.25, sm: 0.5 } }}>
          {/* Theme Toggle */}
          <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
            <IconButton
              onClick={toggleMode}
              size="small"
              sx={{
                color: '#64748b',
                '&:hover': {
                  color: '#cbd5e1',
                },
              }}
            >
              <Brightness4Icon />
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              size="small"
              sx={{
                color: '#64748b',
                '&:hover': {
                  color: '#cbd5e1',
                },
              }}
            >
              <Badge badgeContent={1} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Menu */}
          <Tooltip title="Account">
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{
                color: '#64748b',
                '&:hover': {
                  color: '#cbd5e1',
                },
              }}
            >
              <AccountCircleIcon />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={showUserMenu}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                bgcolor: '#1e293b',
                color: '#e2e8f0',
                mt: 1,
              },
            }}
          >
            <MenuItem
              disabled
              sx={{
                fontSize: '0.75rem',
                color: '#64748b',
              }}
            >
              sre@company.com
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
            <MenuItem onClick={handleMenuClose}>Settings</MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              sx={{
                color: '#ff6b6b',
              }}
            >
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

