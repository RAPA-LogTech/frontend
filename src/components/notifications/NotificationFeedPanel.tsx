import Link from 'next/link'
import { Box, Button, Divider, Stack, Typography } from '@mui/material'
import { formatDateTime } from '@/lib/formatters'
import NoDataState from '@/components/common/NoDataState'
import type { NotificationItem } from '@/lib/types'

type NotificationFeedPanelProps = {
  filteredNotifications: NotificationItem[]
  effectiveReadMap: Record<string, boolean>
  showNoDataEmpty: boolean
  showIncidentsEmpty: boolean
  filter: 'all' | 'unread'
  getSeverityColor: (severity: string) => string
  resolveNotificationRoute: (notification: { route?: string; source?: string }) => string
  onMarkRead: (notificationId: string) => void
  onMove: (route: string, notificationId: string) => void
}

export default function NotificationFeedPanel({
  filteredNotifications,
  effectiveReadMap,
  showNoDataEmpty,
  showIncidentsEmpty,
  filter,
  getSeverityColor,
  resolveNotificationRoute,
  onMarkRead,
  onMove,
}: NotificationFeedPanelProps) {
  if (filteredNotifications.length === 0) {
    if (showNoDataEmpty) {
      return (
        <Box sx={{ p: 2 }}>
          <NoDataState
            title="알림 데이터가 없습니다"
            description="아직 수집된 알림이 없습니다. 알림 이벤트가 발생하면 여기에 표시됩니다."
          />
        </Box>
      )
    }

    if (filter === 'unread') {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          미확인 알림이 없습니다.
        </Typography>
      )
    }

    return null
  }

  return (
    <>
      {filteredNotifications.map((notification, index) => {
        const isUnread = !effectiveReadMap[notification.id]
        const resolvedRoute = resolveNotificationRoute(notification)

        return (
          <Box key={notification.id}>
            <Box
              component={Link}
              href={resolvedRoute}
              sx={{
                display: 'block',
                textDecoration: 'none',
                color: 'inherit',
                p: 2,
                borderLeft: '4px solid',
                borderLeftColor: getSeverityColor(notification.severity),
                bgcolor: isUnread ? 'transparent' : 'action.hover',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              onClick={() => {
                onMarkRead(notification.id)
              }}
            >
              <Stack direction="row" spacing={1.25} alignItems="flex-start">
                <Box
                  sx={{
                    mt: 0.6,
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    bgcolor: getSeverityColor(notification.severity),
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    gap={0.5}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: isUnread ? 700 : 800,
                        lineHeight: 1.35,
                        pr: 1,
                      }}
                    >
                      {notification.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                      {formatDateTime(notification.timestamp)}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 0.5, lineHeight: 1.35 }}
                  >
                    {notification.message}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
                    {notification.source ? (
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: 1,
                          py: 0.25,
                          borderRadius: 999,
                          border: '1px solid',
                          borderColor: 'divider',
                          fontSize: '0.75rem',
                          color: 'text.secondary',
                          lineHeight: 1.4,
                        }}
                      >
                        {notification.source}
                      </Box>
                    ) : null}
                    <Button
                      size="small"
                      variant="text"
                      sx={{ textTransform: 'none', px: 0.5, minWidth: 'auto' }}
                      onClick={event => {
                        event.preventDefault()
                        event.stopPropagation()
                        onMove(resolvedRoute, notification.id)
                      }}
                    >
                      이동
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </Box>
            {index < filteredNotifications.length - 1 ? <Divider /> : null}
          </Box>
        )
      })}
    </>
  )
}
