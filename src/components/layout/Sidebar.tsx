'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Drawer,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Typography,
  ListSubheader,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  CallSplit as TracesIcon,
  BarChart as BarChartIcon,
  Dashboard as GridIcon,
  ElectricBolt as IntegrationIcon,
  Settings as SettingsIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';

export const drawerWidth = 280;

const navGroups = [
  {
    label: 'Observability',
    items: [
      { label: 'Overview', href: '/', icon: DashboardIcon },
      { label: 'Logs', href: '/logs', icon: DescriptionIcon },
      { label: 'Traces', href: '/traces', icon: TracesIcon },
      { label: 'Metrics', href: '/metrics', icon: BarChartIcon },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { label: 'Dashboards', href: '/dashboards', icon: GridIcon },
      { label: 'Integrations', href: '/integrations/slack', icon: IntegrationIcon },
      { label: 'Settings', href: '/settings', icon: SettingsIcon },
    ],
  },
];

interface SidebarProps {
  onOpenAiChat: () => void;
  variant?: 'permanent' | 'temporary';
  openMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ 
  onOpenAiChat, 
  variant = 'permanent',
  openMobile = false,
  onCloseMobile = () => {},
}: SidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <>
      {/* Logo */}
      <Box sx={{ p: 3, borderBottom: '1px solid #1E293B' }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
            color: '#c084fc',
            mb: 0.5,
          }}
        >
          LogTech
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          v0.1.0
        </Typography>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {navGroups.map((group, idx) => (
          <Box key={group.label} sx={{ mb: 4 }}>
            <ListSubheader
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: '#64748b',
                px: 2,
                mb: 1,
              }}
            >
              {group.label}
            </ListSubheader>
            <List sx={{ py: 0 }}>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{ textDecoration: 'none' }}
                  >
                    <ListItemButton
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        bgcolor: isActive ? '#9333ea' : 'transparent',
                        color: isActive ? '#fff' : '#cbd5e1',
                        '&:hover': {
                          bgcolor: isActive ? '#9333ea' : '#1e293b',
                          color: isActive ? '#fff' : '#e2e8f0',
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 40,
                          color: 'inherit',
                        }}
                      >
                        <Icon />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                      />
                    </ListItemButton>
                  </Link>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* AI Chat Button */}
      <Box sx={{ p: 2, borderTop: '1px solid #1E293B' }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<ChatIcon />}
          onClick={onOpenAiChat}
          sx={{
            bgcolor: '#9333ea',
            textTransform: 'none',
            fontSize: '0.875rem',
            '&:hover': {
              bgcolor: '#7e22ce',
            },
          }}
        >
          AI Assistant
        </Button>
      </Box>
    </>
  );

  if (variant === 'permanent') {
    return (
      <Box
        sx={{
          width: drawerWidth,
          height: '100%',
          bgcolor: '#0f172a',
          borderRight: '1px solid #1E293B',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
        }}
      >
        {sidebarContent}
      </Box>
    );
  }

  return (
    <Drawer
      variant="temporary"
      open={openMobile}
      onClose={onCloseMobile}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: '#0f172a',
          borderRight: '1px solid #1E293B',
        },
      }}
    >
      {sidebarContent}
    </Drawer>
  );
}

