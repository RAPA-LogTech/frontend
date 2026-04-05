import {
  Alert,
  Box,
  Button,
  Link as MuiLink,
  Stack,
  Typography,
} from '@mui/material'
import type { SlackIntegrationStatus } from '@/lib/types'

type SlackConnectionStatusPanelProps = {
  integration?: SlackIntegrationStatus
  onTest: () => void
  onReconnect: () => void
  onDisconnect: () => void
  testPending: boolean
  reconnectPending: boolean
  disconnectPending: boolean
  disconnectErrorMessage: string | null
  disconnectSuccess: boolean
}

export default function SlackConnectionStatusPanel({
  integration,
  onTest,
  onReconnect,
  onDisconnect,
  testPending,
  reconnectPending,
  disconnectPending,
  disconnectErrorMessage,
  disconnectSuccess,
}: SlackConnectionStatusPanelProps) {
  const teamDomain = (integration?.teamDomain || '').trim().toLowerCase()
  const hasValidTeamDomain = /^[a-z0-9-]+$/.test(teamDomain)

  const workspaceLink = hasValidTeamDomain
    ? `https://${teamDomain}.slack.com`
    : undefined

  const channelLink = hasValidTeamDomain && integration?.channelId
    ? `https://${teamDomain}.slack.com/archives/${integration.channelId}`
    : undefined

  return (
    <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" spacing={1.25} justifyContent="space-between" alignItems="center" flexWrap="wrap">
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: 1,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Box
              component="img"
              src="/images/icons/slack.png"
              alt="Slack"
              sx={{ width: 20, height: 20, objectFit: 'contain' }}
            />
          </Box>

          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0, flexWrap: 'wrap', rowGap: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Slack 연동됨
            </Typography>

            {workspaceLink ? (
              <MuiLink
                href={workspaceLink}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                sx={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 0.75,
                  py: 0.2,
                  borderRadius: 1,
                  bgcolor: 'action.selected',
                }}
              >
                <Box
                  component="img"
                  src={integration?.teamImage || '/images/icons/slack.png'}
                  alt={integration?.teamName || 'workspace'}
                  sx={{ width: 14, height: 14, borderRadius: 0.5, objectFit: 'cover' }}
                />
                {integration?.teamName || integration?.teamId || '워크스페이스'}
              </MuiLink>
            ) : (
              <Box
                component="span"
                sx={{
                  color: 'text.primary',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontSize: '0.78rem',
                  px: 0.75,
                  py: 0.2,
                  borderRadius: 1,
                  bgcolor: 'action.selected',
                }}
              >
                <Box
                  component="img"
                  src={integration?.teamImage || '/images/icons/slack.png'}
                  alt={integration?.teamName || 'workspace'}
                  sx={{ width: 14, height: 14, borderRadius: 0.5, objectFit: 'cover' }}
                />
                {integration?.teamName || integration?.teamId || '워크스페이스'}
              </Box>
            )}

            {channelLink ? (
              <MuiLink
                href={channelLink}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                sx={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  px: 0.75,
                  py: 0.2,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                  color: 'text.secondary',
                }}
              >
                {integration?.channelName || integration?.channelId || '연결 채널'}
              </MuiLink>
            ) : (
              <Box
                component="span"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  px: 0.75,
                  py: 0.2,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                  color: 'text.secondary',
                }}
              >
                {integration?.channelName || integration?.channelId || '채널 미설정'}
              </Box>
            )}
          </Stack>
        </Stack>

        <Stack direction="row" spacing={0.5}>
          <Button
            variant="outlined"
            size="small"
            onClick={onTest}
            disabled={testPending}
            sx={{ textTransform: 'none' }}
          >
            {testPending ? '전송 중...' : '테스트'}
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={onReconnect}
            disabled={reconnectPending}
            sx={{ textTransform: 'none' }}
          >
            {reconnectPending ? '수정 중...' : '채널 수정'}
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            onClick={onDisconnect}
            disabled={disconnectPending}
            sx={{ textTransform: 'none' }}
          >
            {disconnectPending ? '해제 중...' : '해제'}
          </Button>
        </Stack>
      </Stack>

      {disconnectErrorMessage ? (
        <Alert severity="error" sx={{ mt: 1 }}>
          {disconnectErrorMessage}
        </Alert>
      ) : null}

      {disconnectSuccess ? (
        <Alert severity="success" sx={{ mt: 1 }}>
          Slack 연동이 해제되었습니다.
        </Alert>
      ) : null}
    </Box>
  )
}
