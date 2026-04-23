'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { formatDateTime } from '@/lib/formatters'
import NoDataState from '@/components/common/NoDataState'
import { apiClient } from '@/lib/apiClient'
import type { SlackIncidentSummary } from '@/lib/types'

type IncidentFilter = 'all' | 'ongoing' | 'analyzed' | 'resolved'

type SlackIncidentHistoryPanelProps = {
  incidentFilter: IncidentFilter
  onIncidentFilterChange: (filter: IncidentFilter) => void
  incidents: SlackIncidentSummary[]
  incidentsLoading: boolean
  incidentsErrorMessage: string | null
  onOpenSlackMessage: (incident: SlackIncidentSummary) => void
  analyzingIds?: Set<string>
  onAnalyzeRequest?: (incidentId: string) => void
  autoOpenReportId?: string | null
  onAutoOpenReportClear?: () => void
  focusId?: string | null
  onFocusClear?: () => void
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

const getIncidentStatusChipProps = (
  status: string | null | undefined
): { label: string; variant: 'outlined'; sx: Record<string, string> } => {
  if (status === 'ongoing')
    return {
      label: '진행 중',
      variant: 'outlined',
      sx: { borderColor: 'error.main', color: 'error.main' },
    }
  if (status === 'analyzed')
    return {
      label: '분석 완료',
      variant: 'outlined',
      sx: { borderColor: 'warning.main', color: 'warning.main' },
    }
  if (status === 'resolved')
    return {
      label: '해결 완료',
      variant: 'outlined',
      sx: { borderColor: 'success.main', color: 'success.main' },
    }
  return { label: 'unknown', variant: 'outlined', sx: {} }
}

const getIncidentStatusBorderColor = (status: string | null | undefined) => {
  if (status === 'ongoing') return 'error.main'
  if (status === 'analyzed') return 'warning.main'
  if (status === 'resolved') return 'success.main'
  return 'info.main'
}

function ReportModal({ incidentId, onClose }: { incidentId: string; onClose: () => void }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['incident-detail', incidentId],
    queryFn: () => apiClient.getSlackIncidentDetail(incidentId),
  })

  const detail = data?.detail as Record<string, unknown> | undefined
  const analysis = detail?.analysis as Record<string, unknown> | null | undefined
  const summary = data?.summary

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        component="div"
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          AI 분석 보고서
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        {isLoading ? (
          <Stack spacing={1}>
            <Skeleton variant="rounded" height={24} />
            <Skeleton variant="rounded" height={24} />
            <Skeleton variant="rounded" height={80} />
          </Stack>
        ) : isError ? (
          <Typography variant="body2" color="text.secondary">
            보고서를 불러오지 못했습니다.
          </Typography>
        ) : !analysis ? (
          <Typography variant="body2" color="text.secondary">
            이 인시던트는 AI 분석 없이 해결되었습니다.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {summary
              ? (() => {
                  const p = getIncidentStatusChipProps(summary.status)
                  return (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                      <Chip
                        size="small"
                        color={getIncidentSeverityColor(summary.severity)}
                        label={summary.severity || 'unknown'}
                      />
                      <Chip size="small" label={p.label} variant={p.variant} sx={p.sx} />
                    </Stack>
                  )
                })()
              : null}
            {analysis.incident_summary ? (
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 700, textTransform: 'uppercase' }}
                >
                  장애 요약
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {String(analysis.incident_summary)}
                </Typography>
              </Box>
            ) : null}
            {Array.isArray(analysis.likely_root_causes) &&
            analysis.likely_root_causes.length > 0 ? (
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 700, textTransform: 'uppercase' }}
                >
                  추정 원인
                </Typography>
                <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                  {(analysis.likely_root_causes as string[]).map((c, i) => (
                    <Typography key={i} variant="body2">
                      • {c}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            ) : null}
            {analysis.impact ? (
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 700, textTransform: 'uppercase' }}
                >
                  영향 범위
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {String(analysis.impact)}
                </Typography>
              </Box>
            ) : null}
            {Array.isArray(analysis.immediate_actions) && analysis.immediate_actions.length > 0 ? (
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 700, textTransform: 'uppercase' }}
                >
                  즉시 조치
                </Typography>
                <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                  {(analysis.immediate_actions as string[]).map((a, i) => (
                    <Typography key={i} variant="body2">
                      {i + 1}. {a}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            ) : null}
            {Array.isArray(analysis.evidence_summary) && analysis.evidence_summary.length > 0 ? (
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 700, textTransform: 'uppercase' }}
                >
                  핵심 근거
                </Typography>
                <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                  {(analysis.evidence_summary as string[]).map((e, i) => (
                    <Typography key={i} variant="body2">
                      • {e}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            ) : null}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function SlackIncidentHistoryPanel({
  incidentFilter,
  onIncidentFilterChange,
  incidents,
  incidentsLoading,
  incidentsErrorMessage,
  onOpenSlackMessage,
  analyzingIds = new Set(),
  onAnalyzeRequest,
  autoOpenReportId,
  onAutoOpenReportClear,
  focusId,
  onFocusClear,
}: SlackIncidentHistoryPanelProps) {
  const [reportIncidentId, setReportIncidentId] = useState<string | null>(autoOpenReportId ?? null)
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [highlightId, setHighlightId] = useState<string | null>(null)

  useEffect(() => {
    if (autoOpenReportId) {
      setReportIncidentId(autoOpenReportId)
      onAutoOpenReportClear?.()
    }
  }, [autoOpenReportId])

  useEffect(() => {
    if (!focusId || incidentsLoading) return
    const el = itemRefs.current[focusId]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightId(focusId)
      const t = setTimeout(() => {
        setHighlightId(null)
        onFocusClear?.()
      }, 2500)
      return () => clearTimeout(t)
    }
  }, [focusId, incidentsLoading])

  const analyzeMutation = useMutation({
    mutationFn: (incidentId: string) =>
      fetch('/api/incidents/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident_id: incidentId }),
      }).then(r => r.json()),
    onSuccess: (_, incidentId) => onAnalyzeRequest?.(incidentId),
  })

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
          {(
            [
              { key: 'all', label: '전체' },
              { key: 'ongoing', label: '진행 중' },
              { key: 'analyzed', label: '분석 완료' },
              { key: 'resolved', label: '해결 완료' },
            ] as const
          ).map(item => (
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
        <NoDataState title="조회 실패" description={incidentsErrorMessage} />
      ) : incidents.length === 0 ? (
        <NoDataState
          title={
            incidentFilter === 'all'
              ? '수집된 알람이 없습니다'
              : incidentFilter === 'ongoing'
                ? '진행 중인 알람이 없습니다'
                : incidentFilter === 'analyzed'
                  ? '분석 완료된 알람이 없습니다'
                  : '해결 완료된 알람이 없습니다'
          }
          description={
            incidentFilter === 'ongoing'
              ? 'Slack으로 전달된 알람 중 현재 진행 중인 항목이 없습니다.'
              : incidentFilter === 'analyzed'
                ? 'AI 분석이 완료되었으나 아직 조치되지 않은 알람이 없습니다.'
                : incidentFilter === 'resolved'
                  ? '해결 완료로 처리된 알람 이력이 없습니다.'
                  : 'Slack으로 전달된 알람 이력이 없습니다.'
          }
        />
      ) : (
        <Stack spacing={1}>
          {incidents.map(item => {
            const hasAnalysis = item.status === 'analyzed' || item.status === 'resolved'
            const isAnalyzing =
              analyzingIds.has(item.incident_id) ||
              (analyzeMutation.isPending && analyzeMutation.variables === item.incident_id)
            const analyzeSuccess =
              !isAnalyzing &&
              analyzeMutation.isSuccess &&
              analyzeMutation.variables === item.incident_id
            const isHighlighted = highlightId === item.incident_id

            return (
              <Box
                key={item.incident_id}
                ref={el => {
                  itemRefs.current[item.incident_id] = el as HTMLDivElement | null
                }}
                sx={{
                  border: '1px solid',
                  borderColor: isHighlighted ? 'primary.main' : 'divider',
                  borderLeft: '4px solid',
                  borderLeftColor: isHighlighted
                    ? 'primary.main'
                    : getIncidentStatusBorderColor(item.status),
                  borderRadius: 1.5,
                  p: 1.25,
                  pl: 2,
                  cursor: 'pointer',
                  transition: 'box-shadow 0.15s, border-color 0.3s',
                  boxShadow: isHighlighted
                    ? theme => `0 0 0 3px ${theme.palette.primary.main}33`
                    : theme =>
                        theme.palette.mode === 'dark'
                          ? '0 1px 4px rgba(0,0,0,0.4)'
                          : '0 1px 4px rgba(0,0,0,0.08)',
                  '&:hover': {
                    boxShadow: 'none',
                    bgcolor: theme =>
                      theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  },
                }}
                onClick={() => onOpenSlackMessage(item)}
              >
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 700, color: getIncidentSeverityBorderColor(item.severity) }}
                      noWrap
                    >
                      {item.alert_name || '(알람 이름 없음)'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      영향 서비스: {item.service_info || '-'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      최초 감지 시각: {item.created_at ? formatDateTime(item.created_at) : '-'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      최근 재알림 시각:{' '}
                      {item.last_notified_at ? formatDateTime(item.last_notified_at) : '-'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      해결 시각: {item.resolved_at ? formatDateTime(item.resolved_at) : '-'}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                    <Chip
                      size="small"
                      color={getIncidentSeverityColor(item.severity)}
                      label={item.severity || 'unknown'}
                    />
                    <Chip size="small" {...getIncidentStatusChipProps(item.status)} />
                    {hasAnalysis ? (
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{ textTransform: 'none' }}
                        onClick={e => {
                          e.stopPropagation()
                          setReportIncidentId(item.incident_id)
                        }}
                      >
                        보고서
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        disabled={isAnalyzing || analyzeSuccess}
                        sx={{ textTransform: 'none', minWidth: 80 }}
                        onClick={e => {
                          e.stopPropagation()
                          analyzeMutation.mutate(item.incident_id)
                        }}
                      >
                        {isAnalyzing ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : analyzeSuccess ? (
                          '요청됨'
                        ) : (
                          '분석 요청'
                        )}
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Box>
            )
          })}
        </Stack>
      )}

      {reportIncidentId && (
        <ReportModal incidentId={reportIncidentId} onClose={() => setReportIncidentId(null)} />
      )}
    </Box>
  )
}
