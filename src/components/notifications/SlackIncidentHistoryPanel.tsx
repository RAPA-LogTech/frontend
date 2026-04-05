import {
  Alert,
  Box,
  Button,
  Chip,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { formatDateTime } from '@/lib/formatters'
import type { SlackIncidentSummary } from '@/lib/types'

type IncidentFilter = 'all' | 'ongoing' | 'analyzed' | 'resolved'

type SlackIncidentHistoryPanelProps = {
  incidentFilter: IncidentFilter
  onIncidentFilterChange: (filter: IncidentFilter) => void
  incidents: SlackIncidentSummary[]
  incidentsLoading: boolean
  incidentsErrorMessage: string | null
  onOpenSlackMessage: (incident: SlackIncidentSummary) => void
}

const getIncidentSeverityColor = (severity: string | null | undefined) => {
  if (severity === 'critical' || severity === 'high') return 'error'
  if (severity === 'medium') return 'warning'
  return 'info'
}

const getIncidentSeverityBorderColor = (severity: string | null | undefined) => {
  if (severity === 'critical' || severity === 'high') return 'error.main'
  if (severity === 'medium') return 'warning.main'
  return 'info.main'
}

const getIncidentStatusLabel = (status: string | null | undefined) => {
  if (status === 'ongoing') return '진행 중'
  if (status === 'analyzed') return '분석 완료'
  if (status === 'resolved') return '해결 완료'
  return 'unknown'
}

export default function SlackIncidentHistoryPanel({
  incidentFilter,
  onIncidentFilterChange,
  incidents,
  incidentsLoading,
  incidentsErrorMessage,
  onOpenSlackMessage,
}: SlackIncidentHistoryPanelProps) {
  return (
    <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1}
        sx={{ mb: 1.5 }}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Slack 알람 이력
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Slack으로 전달된 알람 이력을 확인하고 상세 내용을 볼 수 있습니다.
          </Typography>
        </Box>

        <Stack direction="row" spacing={0.75}>
          {([
            { key: 'all', label: '전체' },
            { key: 'ongoing', label: '진행 중' },
            { key: 'analyzed', label: '분석 완료' },
            { key: 'resolved', label: '해결 완료' },
          ] as const).map(item => (
            <Button
              key={item.key}
              size="small"
              variant={incidentFilter === item.key ? 'contained' : 'outlined'}
              sx={{ textTransform: 'none' }}
              onClick={() => onIncidentFilterChange(item.key)}
            >
              {item.label}
            </Button>
          ))}
        </Stack>
      </Stack>

      {incidentsLoading ? (
        <Stack spacing={1}>
          <Skeleton variant="rounded" height={56} />
          <Skeleton variant="rounded" height={56} />
          <Skeleton variant="rounded" height={56} />
        </Stack>
      ) : incidentsErrorMessage ? (
        <Alert severity="error" variant="outlined">
          {incidentsErrorMessage}
        </Alert>
      ) : incidents.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          현재 조건에 해당하는 Slack 알람 이력이 없습니다.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {incidents.map(item => (
            <Box
              key={item.incident_id}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderLeft: '4px solid',
                borderLeftColor: getIncidentSeverityBorderColor(item.severity),
                borderRadius: 1.5,
                p: 1.25,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              onClick={() => onOpenSlackMessage(item)}
            >
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                spacing={1}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                    {item.alert_name || '(알람 이름 없음)'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    영향 서비스: {item.service_info || '-'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    최초 감지 시각: {item.created_at ? formatDateTime(item.created_at) : '-'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    최근 재알림 시각: {item.last_notified_at ? formatDateTime(item.last_notified_at) : '-'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    해결 시각: {item.resolved_at ? formatDateTime(item.resolved_at) : '-'}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                  <Chip
                    size="small"
                    color={getIncidentSeverityColor(item.severity)}
                    label={`severity: ${item.severity || 'unknown'}`}
                  />
                  <Chip size="small" variant="outlined" label={getIncidentStatusLabel(item.status)} />
                </Stack>
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  )
}
