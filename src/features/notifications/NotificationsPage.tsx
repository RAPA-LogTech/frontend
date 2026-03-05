'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { formatDateTime } from '@/lib/formatters';

export default function NotificationsPage() {
  const router = useRouter();
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications-page'],
    queryFn: apiClient.getNotifications,
  });
  const [readMap, setReadMap] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const effectiveReadMap = useMemo(() => {
    const next: Record<string, boolean> = {};
    notifications.forEach((item) => {
      next[item.id] = readMap[item.id] ?? item.read;
    });
    return next;
  }, [notifications, readMap]);

  const unreadCount = notifications.filter((item) => !effectiveReadMap[item.id]).length;
  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'unread') {
      return !effectiveReadMap[item.id];
    }
    return true;
  });

  const getSeverityColor = (severity: string) => {
    if (severity === 'critical' || severity === 'error') return 'error.main';
    if (severity === 'warning') return 'warning.main';
    return 'info.main';
  };

  const resolveNotificationRoute = (notification: { route?: string; source?: string }) => {
    if (notification.route) {
      return notification.route;
    }

    if (notification.source === 'metrics') return '/metrics';
    if (notification.source === 'logs' || notification.source === 'alerts') return '/logs';
    if (notification.source === 'traces') return '/traces';
    if (notification.source === 'integrations') return '/integrations/slack';
    if (notification.source === 'deploy') return '/dashboards';

    return '/';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 }, height: '100%', minHeight: 0 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={1}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          전체 알림
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant={filter === 'all' ? 'contained' : 'outlined'}
            onClick={() => setFilter('all')}
            sx={{ textTransform: 'none', minWidth: 'auto', px: 1.25 }}
          >
            전체 {notifications.length}
          </Button>
          <Button
            size="small"
            color="warning"
            variant={filter === 'unread' ? 'contained' : 'outlined'}
            onClick={() => setFilter('unread')}
            sx={{ textTransform: 'none', minWidth: 'auto', px: 1.25 }}
          >
            미확인 {unreadCount}
          </Button>
        </Stack>
      </Stack>

      <Card
        variant="outlined"
        sx={{
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          height: {
            xs: 'calc(100vh - 220px)',
            md: 'calc(100vh - 240px)',
          },
        }}
      >
        <CardContent sx={{ p: 0, overflowY: 'auto', flex: 1 }}>
          {filteredNotifications.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              {filter === 'unread' ? '미확인 알림이 없습니다.' : '알림이 없습니다.'}
            </Typography>
          ) : (
            filteredNotifications.map((notification, index) => {
              const isUnread = !effectiveReadMap[notification.id];
              const resolvedRoute = resolveNotificationRoute(notification);

              return (
                <Box key={notification.id}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: isUnread ? 'transparent' : 'action.hover',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                    onClick={() => {
                      setReadMap((prev) => ({ ...prev, [notification.id]: true }));
                      router.push(resolvedRoute);
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

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={0.5}>
                          <Typography variant="subtitle2" sx={{ fontWeight: isUnread ? 700 : 800 }}>
                            {notification.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(notification.timestamp)}
                          </Typography>
                        </Stack>

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
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
                            onClick={(event) => {
                              event.stopPropagation();
                              setReadMap((prev) => ({ ...prev, [notification.id]: true }));
                              router.push(resolvedRoute);
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
              );
            })
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
