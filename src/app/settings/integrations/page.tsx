import { Box, Typography } from '@mui/material'
import SlackIntegrationPanel from '@/components/notifications/SlackIntegrationPanel'

export default function IntegrationsPage() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Integrations</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          외부 서비스와의 연동을 설정하고 관리합니다.
        </Typography>
      </Box>
      <SlackIntegrationPanel />
    </Box>
  )
}
