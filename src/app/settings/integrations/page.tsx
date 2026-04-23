'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Box, Divider, Skeleton, Typography } from '@mui/material'
import { apiClient } from '@/lib/apiClient'
import SlackConnectPrompt from '@/components/notifications/SlackConnectPrompt'
import SlackConnectionStatusPanel from '@/components/notifications/SlackConnectionStatusPanel'
import AlertSettingsPanel from '@/components/notifications/AlertSettingsPanel'

export default function IntegrationsPage() {
  const queryClient = useQueryClient()

  const integrationQuery = useQuery({
    queryKey: ['notifications-slack-integration-status'],
    queryFn: apiClient.getSlackIntegration,
  })

  const testSlackMutation = useMutation({
    mutationFn: () => apiClient.sendSlackTestMessage({ text: '[TEST] 알림 연동 테스트' }),
  })

  const disconnectSlackMutation = useMutation({
    mutationFn: () => apiClient.disconnectSlackIntegration(),
    onSuccess: async () => {
      queryClient.setQueryData(['notifications-slack-integration-status'], (prev: unknown) => {
        if (!prev || typeof prev !== 'object') return prev
        return {
          ...(prev as Record<string, unknown>),
          connected: false,
          teamId: undefined,
          teamName: undefined,
          channelId: undefined,
          channelName: undefined,
          webhookUrlMasked: undefined,
          installedBy: undefined,
          installedAt: undefined,
          updatedAt: new Date().toISOString(),
        }
      })
      await queryClient.invalidateQueries({ queryKey: ['notifications-slack-integration-status'] })
      await integrationQuery.refetch()
    },
    onError: error => console.error('Slack 연동 해제 실패:', error),
  })

  const isConnected = integrationQuery.data?.connected ?? false

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Integrations
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          외부 서비스와의 연동을 설정하고 관리합니다.
        </Typography>
      </Box>

      {integrationQuery.isLoading ? (
        <Box sx={{ p: 2 }}>
          <Skeleton variant="rounded" height={82} sx={{ mb: 1 }} />
          <Skeleton variant="rounded" height={82} sx={{ mb: 1 }} />
          <Skeleton variant="rounded" height={82} />
        </Box>
      ) : isConnected ? (
        <>
          <SlackConnectionStatusPanel
            integration={integrationQuery.data}
            onTest={() => testSlackMutation.mutate()}
            onReconnect={() => {
              if (window.confirm('연동을 초기화하고 새로 연동하시겠습니까?')) {
                disconnectSlackMutation.mutate()
                setTimeout(() => {
                  window.location.href = '/api/integrations/slack/connect'
                }, 500)
              }
            }}
            onDisconnect={() => disconnectSlackMutation.mutate()}
            testPending={testSlackMutation.isPending}
            reconnectPending={disconnectSlackMutation.isPending}
            disconnectPending={disconnectSlackMutation.isPending}
            disconnectErrorMessage={
              disconnectSlackMutation.isError
                ? disconnectSlackMutation.error instanceof Error
                  ? disconnectSlackMutation.error.message
                  : 'Slack 연동 해제에 실패했습니다.'
                : null
            }
            disconnectSuccess={disconnectSlackMutation.isSuccess}
          />
          <Divider />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              알람 설정
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Slack으로 전송되는 알람의 동작 방식을 세부적으로 설정합니다.
            </Typography>
            <AlertSettingsPanel />
          </Box>
        </>
      ) : (
        <SlackConnectPrompt />
      )}
    </Box>
  )
}
