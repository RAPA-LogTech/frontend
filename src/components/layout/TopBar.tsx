'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
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
  Divider,
  Stack,
  Button,
} from '@mui/material'
import {
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Menu as MenuIcon,
  Brightness4 as Brightness4Icon,
} from '@mui/icons-material'
import { useColorMode } from '@/app/providers'
import { apiClient } from '@/lib/apiClient'
import { formatDateTime } from '@/lib/formatters'
import { SlackIntegrationStatus } from '@/lib/types'

const drawerWidth = 280
const topBarHeight = 48

interface TopBarProps {
  onMenuClick?: () => void
  showMenuButton?: boolean
}

export default function TopBar({ onMenuClick, showMenuButton = false }: TopBarProps) {
  const router = useRouter()
  const { mode, toggleMode } = useColorMode()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [userAnchorEl, setUserAnchorEl] = useState<null | HTMLElement>(null)
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null)
  const { data: allIncidents } = useQuery({
    queryKey: ['topbar-all-incidents'],
    queryFn: () => apiClient.getSlackIncidents({ status: 'all', limit: 50 }),
    refetchInterval: 30_000,
  })
  const incidents = allIncidents?.items ?? []
  const ongoingCount = incidents.filter(i => i.status === 'ongoing').length
  const slackIntegrationQuery = useQuery<SlackIntegrationStatus>({
    queryKey: ['topbar-slack-integration'],
    queryFn: apiClient.getSlackIntegration,
  })
  const slackConfigQuery = useQuery<{ configured: boolean; message?: string }>({
    queryKey: ['topbar-slack-config'],
    queryFn: async () => {
      const response = await fetch('/api/integrations/slack/config', { cache: 'no-store' })
      if (!response.ok) throw new Error('Slack OAuth 설정 조회에 실패했습니다.')
      return (await response.json()) as { configured: boolean; message?: string }
    },
  })

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserAnchorEl(event.currentTarget)
    setShowUserMenu(true)
  }

  const handleMenuClose = () => {
    setUserAnchorEl(null)
    setShowUserMenu(false)
  }

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget)
  }

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null)
  }

React.useEffect(() => {
    router.prefetch('/notifications')
  }, [router])

  return (
    <AppBar
      position="fixed"
      sx={{
        height: `${topBarHeight}px`,
        width: '100%',
        bgcolor: theme => (theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff'),
        color: theme => theme.palette.text.primary,
        borderBottom: '1px solid',
        borderColor: theme => theme.palette.divider,
        boxShadow: 'none',
        zIndex: theme => theme.zIndex.drawer + 1,
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
                color: theme => theme.palette.text.secondary,
                '&:hover': {
                  color: theme => theme.palette.text.primary,
                },
                mr: 1,
              }}
            >
              <MenuIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Left */}
        <Box
          component={Link}
          href="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          <Box
            component="img"
            src="/logo/android-chrome-192x192.png"
            alt="LogTech"
            sx={{
              width: 32,
              height: 32,
            }}
          />
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: theme => theme.palette.text.primary,
                lineHeight: 1,
              }}
            >
              LogTech
            </Typography>
          </Box>
          <Chip
            label="Live"
            size="small"
            sx={{
              bgcolor: theme => theme.palette.success.main,
              color: '#ffffff',
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
                color: theme => theme.palette.text.secondary,
                '&:hover': {
                  color: theme => theme.palette.text.primary,
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
              onClick={handleNotificationMenuOpen}
              sx={{
                color: theme => theme.palette.text.secondary,
                '&:hover': {
                  color: theme => theme.palette.text.primary,
                },
              }}
            >
              <Badge badgeContent={ongoingCount || undefined} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={notificationAnchorEl}
            open={Boolean(notificationAnchorEl)}
            onClose={handleNotificationMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                bgcolor: theme => theme.palette.background.paper,
                color: theme => theme.palette.text.primary,
                mt: 1,
                width: 380,
                maxWidth: 'calc(100vw - 24px)',
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
              },
            }}
          >
            <Box>
              {/* 헤더 */}
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ px: 2, py: 1.5 }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  알림
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  component={Link}
                  href="/notifications"
                  onClick={handleNotificationMenuClose}
                  sx={{ textTransform: 'none', fontSize: '0.75rem', px: 0, minWidth: 'auto', color: 'text.secondary' }}
                >
                  전체 보기
                </Button>
              </Stack>

              <Divider />

              {/* 슬랙 미연동 */}
              {!slackIntegrationQuery.data?.connected ? (
                <Box sx={{ p: 2 }}>
                  <Stack spacing={1.5} alignItems="center" textAlign="center">
                    <Box sx={{ width: 28, height: 28, position: 'relative' }}>
                      <Image src="/images/icons/slack.png" alt="Slack" fill sizes="28px" style={{ objectFit: 'contain' }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Slack 미연동</Typography>
                      <Typography variant="caption" color="text.secondary">
                        슬랙을 연동하면 알림을 받을 수 있습니다.
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      size="small"
                      disabled={!slackConfigQuery.data?.configured}
                      onClick={() => { window.location.href = '/api/integrations/slack/connect' }}
                      sx={{ textTransform: 'none' }}
                    >
                      Slack 연동하기
                    </Button>
                    {!slackConfigQuery.data?.configured && (
                      <Typography variant="caption" color="warning.main">
                        {slackConfigQuery.data?.message || 'Slack OAuth 설정이 없습니다.'}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              ) : (
                /* 인시던트 목록 */
                <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                  {incidents.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                      알림이 없습니다.
                    </Typography>
                  ) : (
                    incidents.map((incident, idx) => {
                      const isOngoing = incident.status === 'ongoing'
                      return (
                        <Box key={incident.incident_id}>
                          <Box
                            component={Link}
                            href={`/notifications?status=${incident.status ?? 'all'}&id=${encodeURIComponent(incident.incident_id)}`}
                            onClick={handleNotificationMenuClose}
                            sx={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 1.25,
                              px: 2,
                              py: 1.25,
                              textDecoration: 'none',
                              color: 'inherit',
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                          >
                            {/* 점 */}
                            <Box
                              sx={{
                                mt: '5px',
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                flexShrink: 0,
                                bgcolor: isOngoing ? 'error.main' : 'transparent',
                                border: isOngoing ? 'none' : '1.5px solid',
                                borderColor: 'text.disabled',
                              }}
                            />
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: isOngoing ? 700 : 400, lineHeight: 1.4, color: isOngoing ? 'text.primary' : 'text.secondary' }}
                                  noWrap
                                >
                                  {incident.alert_name ?? incident.incident_id}
                                </Typography>
                                {incident.severity && (
                                  <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0 }}>
                                    {incident.severity}
                                  </Typography>
                                )}
                              </Stack>
                              <Typography variant="caption" color="text.disabled">
                                {incident.created_at ? formatDateTime(incident.created_at) : ''}
                              </Typography>
                            </Box>
                          </Box>
                          {idx < incidents.length - 1 && <Divider />}
                        </Box>
                      )
                    })
                  )}
                </Box>
              )}
            </Box>
          </Menu>

          {/* User Menu */}
          <Tooltip title="Account">
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{
                color: theme => theme.palette.text.secondary,
                '&:hover': {
                  color: theme => theme.palette.text.primary,
                },
              }}
            >
              <AccountCircleIcon />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={userAnchorEl}
            open={showUserMenu}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                bgcolor: theme => theme.palette.background.paper,
                color: theme => theme.palette.text.primary,
                mt: 1,
              },
            }}
          >
            <MenuItem
              disabled
              sx={{
                fontSize: '0.75rem',
                color: 'text.secondary',
              }}
            >
              sre@company.com
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
            <MenuItem onClick={handleMenuClose}>Settings</MenuItem>
            <MenuItem
              onClick={() => { window.location.href = '/api/auth/cognito/logout' }}
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
  )
}
