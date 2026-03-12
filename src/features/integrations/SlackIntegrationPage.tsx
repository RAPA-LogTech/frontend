'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  Stack,
  Typography,
  Divider,
  Dialog,
  DialogContent,
  DialogTitle,
  Chip,
} from '@mui/material';
import { apiClient } from '@/lib/apiClient';

export default function SlackIntegrationPage() {
  const searchParams = useSearchParams();
  const [openSlackDialog, setOpenSlackDialog] = useState(false);

  const integrationQuery = useQuery({
    queryKey: ['slack-integration'],
    queryFn: () => apiClient.getSlackIntegration(),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => apiClient.disconnectSlackIntegration(),
    onSuccess: () => {
      integrationQuery.refetch();
    },
  });

  const testMutation = useMutation({
    mutationFn: () =>
      apiClient.sendSlackTestMessage({
        text: '[TEST] Observability alert pipeline health check',
      }),
  });

  const oauthStatus = searchParams.get('slack');
  const oauthDetails = searchParams.get('details');

  const oauthFeedback = useMemo(() => {
    if (!oauthStatus) {
      return null;
    }

    if (oauthStatus === 'connected') {
      return { severity: 'success' as const, message: 'Slack 워크스페이스 연결이 완료되었습니다.' };
    }

    if (oauthStatus === 'cancelled') {
      return { severity: 'warning' as const, message: 'Slack 권한 승인이 취소되었습니다.' };
    }

    if (oauthStatus === 'not-configured') {
      return {
        severity: 'error' as const,
        message: '서버에 Slack OAuth 환경 변수가 설정되지 않았습니다.',
      };
    }

    return {
      severity: 'error' as const,
      message: `Slack OAuth 처리 중 오류가 발생했습니다${oauthDetails ? `: ${oauthDetails}` : ''}`,
    };
  }, [oauthDetails, oauthStatus]);

  const connected = integrationQuery.data?.connected ?? false;
  const oauthConfigured = integrationQuery.data?.oauthConfigured ?? false;
  const canTest = connected && !testMutation.isPending;

  const statusLabel = connected ? '연동 완료' : '연동 전';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={3}>
            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1.5 }}>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                외부 연동
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: 2,
                maxWidth: 460,
              }}
            >
              <Card variant="outlined">
                <CardContent sx={{ p: 2.5 }}>
                  <Stack spacing={1.5}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        position: 'relative',
                      }}
                    >
                      <Image
                        src="/images/icons/slack.png"
                        alt="Slack"
                        fill
                        sizes="40px"
                        style={{ objectFit: 'contain' }}
                      />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Slack</Typography>
                    <Typography variant="body2" color="text.secondary">
                      A/B 테스트 등 모든 변경사항에 대한 업데이트를 슬랙 메시지로 확인할 수 있습니다.
                    </Typography>
                    <Box>
                      <Button
                        variant={connected ? 'outlined' : 'contained'}
                        onClick={() => setOpenSlackDialog(true)}
                        sx={{ textTransform: 'none' }}
                      >
                        {connected ? '연동 완료' : '연동하기'}
                      </Button>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Dialog
        open={openSlackDialog}
        onClose={() => setOpenSlackDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <DialogTitle sx={{ px: { xs: 2.5, md: 4 }, pt: 3, pb: 1, fontWeight: 800 }}>Slack 연동</DialogTitle>
        <DialogContent sx={{ px: { xs: 2.5, md: 4 }, pb: 4 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Typography variant="body1" sx={{ fontWeight: 700 }}>연동 상태</Typography>
              <Chip
                size="small"
                label={statusLabel}
                color={connected ? 'success' : 'default'}
                variant={connected ? 'filled' : 'outlined'}
              />
            </Stack>

            <Typography variant="body2" color="text.secondary">
              아래 버튼을 눌러 워크스페이스 권한 요청을 확인해주세요.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
              <Button
                variant="contained"
                onClick={() => {
                  window.location.href = '/api/integrations/slack/connect';
                }}
                disabled={!oauthConfigured}
                sx={{ textTransform: 'none' }}
              >
                Slack 연동하기
              </Button>
              <Button
                variant="outlined"
                onClick={() => testMutation.mutate()}
                disabled={!canTest}
                sx={{ textTransform: 'none' }}
              >
                {testMutation.isPending ? '전송 중...' : '테스트 메시지'}
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => disconnectMutation.mutate()}
                disabled={!connected || disconnectMutation.isPending}
                sx={{ textTransform: 'none' }}
              >
                {disconnectMutation.isPending ? '해제 중...' : '연동 해제'}
              </Button>
            </Stack>

            <Divider sx={{ my: 1 }} />

            <Box sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.08)' : '#f8fafc', borderRadius: 2, p: 2.5 }}>
              <Typography variant="body1" sx={{ fontWeight: 800, mb: 1.5 }}>연동 방법</Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>1. Slack 연동하기 버튼을 클릭하여 워크스페이스 액세스 요청을 확인해주세요.</Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>2. 메시지가 게시될 채널을 선택해주세요.</Typography>
              <Typography variant="body2">3. 연동 완료 후 테스트 메시지를 보내 정상 동작 여부를 확인해주세요.</Typography>
            </Box>

            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">워크스페이스: {integrationQuery.data?.teamName ?? '-'}</Typography>
              <Typography variant="caption" color="text.secondary">채널: {integrationQuery.data?.channelName ?? '-'}</Typography>
            </Stack>

            {oauthFeedback && (
              <Alert severity={oauthFeedback.severity} variant="outlined">
                {oauthFeedback.message}
              </Alert>
            )}

            {!oauthConfigured && (
              <Alert severity="warning" variant="outlined">
                서버에 SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_SIGNING_SECRET 환경 변수를 설정해야 연동이 동작합니다.
              </Alert>
            )}

            {integrationQuery.isError && (
              <Alert severity="error" variant="outlined">
                {(integrationQuery.error as Error).message}
              </Alert>
            )}

            {disconnectMutation.isError && (
              <Alert severity="error" variant="outlined">
                {(disconnectMutation.error as Error).message}
              </Alert>
            )}

            {testMutation.isError && (
              <Alert severity="error" variant="outlined">
                {(testMutation.error as Error).message}
              </Alert>
            )}

            {testMutation.data?.ok && (
              <Alert severity="success" variant="outlined">
                테스트 메시지 전송 완료: {testMutation.data.channel}
              </Alert>
            )}

            {disconnectMutation.data?.ok && (
              <Alert severity="success" variant="outlined">
                Slack 연동이 해제되었습니다.
              </Alert>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
