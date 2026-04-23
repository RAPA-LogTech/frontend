'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Skeleton,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'

function SwitchRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      onClick={() => onChange(!checked)}
      sx={{
        px: 1.5,
        py: 1,
        borderRadius: 1.5,
        cursor: 'pointer',
        '&:hover': {
          bgcolor: theme => theme.palette.action.hover,
        },
      }}
    >
      <Switch
        size="small"
        checked={checked}
        onChange={e => {
          e.stopPropagation()
          onChange(e.target.checked)
        }}
        sx={{ flexShrink: 0 }}
      />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.4 }}>
          {label}
        </Typography>
        {description && (
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
            {description}
          </Typography>
        )}
      </Box>
    </Stack>
  )
}
import { apiClient } from '@/lib/apiClient'
import type { SlackAlertSettings, SlackAlertSeverity } from '@/lib/types'
import { DEFAULT_SLACK_ALERT_SETTINGS } from '@/lib/types'

const SEVERITY_OPTIONS: {
  value: SlackAlertSeverity
  label: string
  color: 'default' | 'info' | 'warning' | 'error'
}[] = [
  { value: 'low', label: 'Low', color: 'default' },
  { value: 'medium', label: 'Medium', color: 'info' },
  { value: 'high', label: 'High', color: 'warning' },
  { value: 'critical', label: 'Critical', color: 'error' },
]

const RENOTIFY_MARKS = [
  { value: 5, label: '5분' },
  { value: 30, label: '30분' },
  { value: 60, label: '1시간' },
  { value: 120, label: '2시간' },
  { value: 180, label: '3시간' },
  { value: 240, label: '4시간' },
  { value: 300, label: '5시간' },
  { value: 360, label: '6시간' },
]

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card variant="outlined" sx={{ borderColor: 'divider' }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
        </Box>
        {children}
      </CardContent>
    </Card>
  )
}

export default function AlertSettingsPanel() {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<SlackAlertSettings>(DEFAULT_SLACK_ALERT_SETTINGS)
  const [isDirty, setIsDirty] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['slack-alert-settings'],
    queryFn: apiClient.getSlackAlertSettings,
  })

  useEffect(() => {
    if (data) {
      setDraft(data)
      setIsDirty(false)
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: apiClient.updateSlackAlertSettings,
    onSuccess: saved => {
      queryClient.setQueryData(['slack-alert-settings'], saved)
      setIsDirty(false)
    },
  })

  const update = <K extends keyof SlackAlertSettings>(key: K, value: SlackAlertSettings[K]) => {
    setDraft(prev => ({ ...prev, [key]: value }))
    setIsDirty(true)
  }

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={120} />
        <Skeleton variant="rounded" height={160} />
        <Skeleton variant="rounded" height={140} />
      </Stack>
    )
  }

  if (isError) {
    return <Alert severity="error">알람 설정을 불러오지 못했습니다.</Alert>
  }

  return (
    <Stack spacing={2}>
      {/* 재알람 간격 */}
      <SectionCard
        title="재알람 간격"
        description="동일 인시던트가 ongoing 상태일 때 몇 분마다 재전송할지 설정합니다."
      >
        <Box sx={{ px: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              현재 설정
            </Typography>
            <Chip
              size="small"
              label={
                draft.renotify_interval_minutes < 60
                  ? `${draft.renotify_interval_minutes}분`
                  : `${draft.renotify_interval_minutes / 60}시간`
              }
              color="primary"
              variant="outlined"
            />
          </Stack>
          <Slider
            value={draft.renotify_interval_minutes}
            onChange={(_, v) => update('renotify_interval_minutes', v as number)}
            min={1}
            max={360}
            step={1}
            marks={RENOTIFY_MARKS}
            valueLabelDisplay="auto"
            valueLabelFormat={v => (v < 60 ? `${v}분` : `${v / 60}시간`)}
          />
        </Box>
      </SectionCard>

      {/* Severity 필터 */}
      <SectionCard
        title="최소 알람 심각도"
        description="이 수준 이상의 심각도만 Slack으로 전송합니다."
      >
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {SEVERITY_OPTIONS.map(opt => (
            <Chip
              key={opt.value}
              label={opt.label}
              color={draft.min_severity === opt.value ? opt.color : 'default'}
              variant={draft.min_severity === opt.value ? 'filled' : 'outlined'}
              onClick={() => update('min_severity', opt.value)}
              sx={{ cursor: 'pointer', fontWeight: draft.min_severity === opt.value ? 700 : 400 }}
            />
          ))}
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          선택된 심각도 이상:{' '}
          {SEVERITY_OPTIONS.filter(
            o =>
              SEVERITY_OPTIONS.findIndex(x => x.value === o.value) >=
              SEVERITY_OPTIONS.findIndex(x => x.value === draft.min_severity)
          )
            .map(o => o.label)
            .join(', ')}
        </Typography>
      </SectionCard>

      {/* Quiet Hours */}
      <SectionCard
        title="방해 금지 시간대 (Quiet Hours)"
        description="설정한 시간대에는 알람 전송을 억제하거나 critical만 허용합니다."
      >
        <Stack spacing={2}>
          <SwitchRow
            label="방해 금지 시간대 활성화"
            checked={draft.quiet_hours_enabled}
            onChange={v => update('quiet_hours_enabled', v)}
          />
          {draft.quiet_hours_enabled && (
            <>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 0.5 }}
                  >
                    시작 시간
                  </Typography>
                  <TextField
                    type="time"
                    size="small"
                    fullWidth
                    value={draft.quiet_hours_start}
                    onChange={e => update('quiet_hours_start', e.target.value)}
                    inputProps={{ step: 300 }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ pt: { sm: 2.5 } }}>
                  ~
                </Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 0.5 }}
                  >
                    종료 시간
                  </Typography>
                  <TextField
                    type="time"
                    size="small"
                    fullWidth
                    value={draft.quiet_hours_end}
                    onChange={e => update('quiet_hours_end', e.target.value)}
                    inputProps={{ step: 300 }}
                  />
                </Box>
              </Stack>
              <SwitchRow
                label="방해 금지 시간대에도 Critical은 전송"
                checked={draft.quiet_hours_critical_only}
                onChange={v => update('quiet_hours_critical_only', v)}
              />
            </>
          )}
        </Stack>
      </SectionCard>

      {/* 메시지 포함 정보 */}
      <SectionCard
        title="메시지 포함 정보"
        description="Slack 알람 메시지에 포함할 정보를 선택합니다."
      >
        <Stack spacing={1.25}>
          <SwitchRow
            label="서비스 정보 포함"
            description="영향받은 서비스 이름과 환경을 메시지에 표시합니다."
            checked={draft.include_service_info}
            onChange={v => update('include_service_info', v)}
          />
          <SwitchRow
            label="트레이스 링크 포함"
            description="관련 트레이스 상세 페이지로 이동하는 링크를 추가합니다."
            checked={draft.include_trace_link}
            onChange={v => update('include_trace_link', v)}
          />
          <SwitchRow
            label="로그 링크 포함"
            description="관련 로그 조회 페이지로 이동하는 링크를 추가합니다."
            checked={draft.include_log_link}
            onChange={v => update('include_log_link', v)}
          />
        </Stack>
      </SectionCard>

      {/* 저장 */}
      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="flex-end">
        {saveMutation.isError && (
          <Typography variant="caption" color="error">
            {saveMutation.error instanceof Error
              ? saveMutation.error.message
              : '저장에 실패했습니다.'}
          </Typography>
        )}
        {saveMutation.isSuccess && !isDirty && (
          <Typography variant="caption" color="success.main">
            저장되었습니다.
          </Typography>
        )}
        <Button
          variant="outlined"
          size="small"
          disabled={!isDirty || saveMutation.isPending}
          onClick={() => {
            setDraft(data ?? DEFAULT_SLACK_ALERT_SETTINGS)
            setIsDirty(false)
          }}
          sx={{ textTransform: 'none' }}
        >
          되돌리기
        </Button>
        <Button
          variant="contained"
          size="small"
          disabled={!isDirty || saveMutation.isPending}
          onClick={() => saveMutation.mutate(draft)}
          sx={{ textTransform: 'none' }}
        >
          {saveMutation.isPending ? '저장 중...' : '저장'}
        </Button>
      </Stack>
    </Stack>
  )
}
