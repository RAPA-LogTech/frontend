import {
  Box,
  Button,
  Chip,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { formatDateTime } from '@/lib/formatters'
import NoDataState from '@/components/common/NoDataState'
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

const getIncidentStatusChipProps = (status: string | null | undefined) => {
  if (status === 'ongoing') return { label: '진행 중', variant: 'outlined' as const, sx: { borderColor: 'error.main', color: 'error.main' } }
  if (status === 'analyzed') return { label: '분석 완료', variant: 'outlined' as const, sx: { borderColor: 'warning.main', color: 'warning.main' } }
  if (status === 'resolved') return { label: '해결 완료', variant: 'outlined' as const, sx: { borderColor: 'success.main', color: 'success.main' } }
  return { label: 'unknown', variant: 'outlined' as const, sx: {} }
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
          <Skeleton variant="rounded" height={88} />
          <Skeleton variant="rounded" height={88} />
          <Skeleton variant="rounded" height={88} />
        </Stack>
      ) : incidentsErrorMessage ? (
        <NoDataState
          title="조회 실패"
          description={incidentsErrorMessage}
        />
      ) : incidents.length === 0 ? (
        <NoDataState
          title={
            incidentFilter === 'all' ? '수집된 알람이 없습니다' :
            incidentFilter === 'ongoing' ? '진행 중인 알람이 없습니다' :
            incidentFilter === 'analyzed' ? '분석 완료된 알람이 없습니다' :
            '해결 완료된 알람이 없습니다'
          }
          description={
            incidentFilter === 'ongoing' ? 'Slack으로 전달된 알람 중 현재 진행 중인 항목이 없습니다.' :
            incidentFilter === 'analyzed' ? 'AI 분석이 완료되었으나 아직 조치되지 않은 알람이 없습니다.' :
            incidentFilter === 'resolved' ? '해결 완료로 처리된 알람 이력이 없습니다.' :
            'Slack으로 전달된 알람 이력이 없습니다.'
          }
        />
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
                  <Chip size="small" {...getIncidentStatusChipProps(item.status)} />
                </Stack>
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  )
}
