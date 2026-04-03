'use client'

import React, { useMemo, useState } from 'react'
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
  Alert,
  Card,
  CardContent,
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
  const { data: notifications = [] } = useQuery({
    queryKey: ['topbar-notifications'],
    queryFn: apiClient.getNotifications,
  })
  const slackIntegrationQuery = useQuery<SlackIntegrationStatus>({
    queryKey: ['topbar-slack-integration'],
    queryFn: apiClient.getSlackIntegration,
  })
  const disconnectSlackMutation = useMutation({
    mutationFn: () => apiClient.disconnectSlackIntegration(),
    onSuccess: () => {
      slackIntegrationQuery.refetch()
    },
  })
  const testSlackMutation = useMutation({
    mutationFn: () =>
      apiClient.sendSlackTestMessage({
        text: '[TEST] 알림 연동 테스트',
      }),
  })
  const [notificationReadMap, setNotificationReadMap] = useState<Record<string, boolean>>({})
  const effectiveNotificationReadMap = useMemo(() => {
    const next: Record<string, boolean> = {}

    notifications.forEach(notification => {
      next[notification.id] = notificationReadMap[notification.id] ?? notification.read
    })

    return next
  }, [notifications, notificationReadMap])

  const unreadCount = notifications.filter(notification => !effectiveNotificationReadMap[notification.id]).length

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

  const handleNotificationItemClick = (notificationId: string) => {
    setNotificationReadMap(prev => ({
      ...prev,
      [notificationId]: true,
    }))
    handleNotificationMenuClose()
  }

  const resolveNotificationRoute = (notification: { route?: string; source?: string }) => {
    if (notification.route) {
      return notification.route
    }

    if (notification.source === 'metrics') return '/metrics'
    if (notification.source === 'logs' || notification.source === 'alerts') return '/logs'
    if (notification.source === 'traces') return '/traces'
    if (notification.source === 'integrations') return '/integrations/slack'
    if (notification.source === 'deploy') return '/dashboards'

    return '/'
  }

  React.useEffect(() => {
    const routes = new Set<string>(['/notifications'])
    notifications.forEach(notification => {
      routes.add(resolveNotificationRoute(notification))
    })
    routes.forEach(route => router.prefetch(route))
  }, [notifications, router])

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
              <Badge badgeContent={unreadCount} color="error">
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
                width: 460,
                maxWidth: 'calc(100vw - 24px)',
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
              },
            }}
          >
            <Box>
              {/* 슬랙 미연동 시: 슬랙 연동 UI 표시 */}
              {!slackIntegrationQuery.data?.connected ? (
                <>
                  <Box sx={{ p: 1.5, pb: 1 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        알림 설정
                      </Typography>
                    </Stack>
                  </Box>

                  <Divider />

                  <Box sx={{ p: 1.5 }}>
                    <Stack spacing={2}>
                      {/* Slack 연결 카드 */}
                      <Card variant="outlined">
                        <CardContent sx={{ p: 2 }}>
                          <Stack spacing={1.5} alignItems="center" textAlign="center">
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                position: 'relative',
                              }}
                            >
                              <Image
                                src="/images/icons/slack.png"
                                alt="Slack"
                                fill
                                sizes="32px"
                                style={{ objectFit: 'contain' }}
                              />
                            </Box>

                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                                Slack 연동
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                슬랙을 연동하여 실시간 알림을 받을 수 있습니다.
                              </Typography>
                            </Box>

                            <Box sx={{ mt: 0.5, width: '100%', display: 'flex', justifyContent: 'center' }}>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => {
                                  window.location.href = '/api/integrations/slack/connect'
                                }}
                                sx={{ textTransform: 'none', width: 'fit-content' }}
                              >
                                Slack 연동하기
                              </Button>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>

                      {/* 에러/경고 메시지 */}
                      {slackIntegrationQuery.isError && (
                        <Alert severity="error" variant="outlined">
                          {(slackIntegrationQuery.error as Error).message}
                        </Alert>
                      )}

                    </Stack>
                  </Box>
                </>
              ) : (
                /* 슬랙 연동 시: 기존 알림 목록 표시 */
                <>
                  <Box sx={{ p: 1.5, pb: 1 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        알림
                      </Typography>
                      <Button
                        size="small"
                        variant="text"
                        component={Link}
                        href="/notifications"
                        onClick={handleNotificationMenuClose}
                        sx={{ textTransform: 'none', fontSize: '0.75rem', px: 0.5, minWidth: 'auto' }}
                      >
                        전체 알림으로 보기
                      </Button>
                    </Stack>

                    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                      <Chip
                        label={`전체 ${notifications.length}`}
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                      <Chip label={`미확인 ${unreadCount}`} size="small" variant="outlined" />
                    </Stack>
                  </Box>

                  <Divider />

                  <Box sx={{ maxHeight: 420, overflowY: 'auto', p: 1 }}>
                    {notifications.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
                        알림이 없습니다.
                      </Typography>
                    ) : (
                      notifications.map(notification => {
                        const isUnread = !effectiveNotificationReadMap[notification.id]
                        const resolvedRoute = resolveNotificationRoute(notification)
                        const accentColor = (theme: any) => {
                          if (notification.severity === 'critical' || notification.severity === 'error') {
                            return theme.palette.error.main
                          }
                          if (notification.severity === 'warning') {
                            return theme.palette.warning.main
                          }
                          return theme.palette.info.main
                        }

                        return (
                          <Box
                            key={notification.id}
                            component={Link}
                            href={resolvedRoute}
                            onClick={() => handleNotificationItemClick(notification.id)}
                            sx={{
                              display: 'block',
                              textDecoration: 'none',
                              color: 'inherit',
                              p: 1.25,
                              borderRadius: 1,
                              mb: 0.75,
                              cursor: 'pointer',
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: isUnread ? 'transparent' : 'action.hover',
                              '&:hover': {
                                bgcolor: 'action.hover',
                              },
                            }}
                          >
                            <Stack direction="row" spacing={1} alignItems="flex-start">
                              <Box
                                sx={{
                                  mt: 0.4,
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: accentColor,
                                  flexShrink: 0,
                                }}
                              />
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Stack direction="row" justifyContent="space-between" spacing={1}>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: isUnread ? 600 : 700,
                                      lineHeight: 1.35,
                                      pr: 1,
                                    }}
                                  >
                                    {notification.title}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ flexShrink: 0 }}
                                  >
                                    {formatDateTime(notification.timestamp)}
                                  </Typography>
                                </Stack>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: 'block', mt: 0.35, lineHeight: 1.35 }}
                                >
                                  {notification.message}
                                </Typography>
                              </Box>
                            </Stack>
                          </Box>
                        )
                      })
                    )}
                  </Box>
                </>
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
  )
}
