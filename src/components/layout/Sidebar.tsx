'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  CallSplit as TracesIcon,
  BarChart as BarChartIcon,
  Dashboard as GridIcon,
  Settings as SettingsIcon,
  Chat as ChatIcon,
  Notifications as NotificationsIcon,
  MenuBook as RunbookIcon,
  Assessment as ReportsIcon,
} from '@mui/icons-material'

export const drawerWidth = 280

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
      { label: 'Reports', href: '/reports', icon: ReportsIcon },
      { label: 'Runbooks', href: '/runbooks', icon: RunbookIcon },
      { label: 'Notifications', href: '/notifications', icon: NotificationsIcon },
      { label: 'Settings', href: '/settings', icon: SettingsIcon },
    ],
  },
]

interface SidebarProps {
  onOpenAiChat: () => void
  variant?: 'permanent' | 'temporary'
  openMobile?: boolean
  onCloseMobile?: () => void
}

export default function Sidebar({
  onOpenAiChat,
  variant = 'permanent',
  openMobile = false,
  onCloseMobile = () => {},
}: SidebarProps) {
  const pathname = usePathname()

  const isItemActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const sidebarContent = (
    <>
      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {navGroups.map((group, idx) => (
          <Box key={group.label} sx={{ mb: 4 }}>
            <ListSubheader
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.35,
                color: theme => theme.palette.text.secondary,
                bgcolor: theme =>
                  theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.10)' : 'rgba(15,23,42,0.04)',
                borderRadius: 1,
                px: 2,
                py: 0.6,
                mb: 1,
              }}
            >
              {group.label}
            </ListSubheader>
            <List sx={{ py: 0 }}>
              {group.items.map(item => {
                const Icon = item.icon
                const isActive = isItemActive(item.href)
                return (
                  <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                    <ListItemButton
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        bgcolor: isActive ? theme => theme.palette.primary.main : 'transparent',
                        color: isActive ? '#fff' : theme => theme.palette.text.secondary,
                        '&:hover': {
                          bgcolor: isActive
                            ? theme => theme.palette.primary.dark
                            : theme => theme.palette.action.hover,
                          color: isActive ? '#fff' : theme => theme.palette.text.primary,
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
                )
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* AI Chat Button */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: theme => theme.palette.divider }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<ChatIcon />}
          onClick={onOpenAiChat}
          sx={{
            bgcolor: '#9333ea',
            color: '#ffffff',
            textTransform: 'none',
            fontSize: '0.875rem',
            '&:hover': {
              bgcolor: '#7e22ce',
              color: '#ffffff',
            },
          }}
        >
          AI Assistant
        </Button>
      </Box>
    </>
  )

  if (variant === 'permanent') {
    return (
      <Box
        sx={{
          width: drawerWidth,
          height: '100%',
          pt: '48px',
          bgcolor: theme => (theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff'),
          borderRight: '1px solid',
          borderColor: theme => theme.palette.divider,
          display: 'flex',
          flexDirection: 'column',
          overflowX: 'hidden',
          overflowY: 'auto',
        }}
      >
        {sidebarContent}
      </Box>
    )
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
          paddingTop: '48px',
          bgcolor: theme => (theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff'),
          borderRight: '1px solid',
          borderColor: theme => theme.palette.divider,
        },
      }}
    >
      {sidebarContent}
    </Drawer>
  )
}
