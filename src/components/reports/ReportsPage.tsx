'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  Add as AddIcon,
  DeleteOutline as DeleteIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Description as ReportIcon,
} from '@mui/icons-material'
import { apiClient } from '@/lib/apiClient'
import { formatDateTime } from '@/lib/formatters'
import NoDataState from '@/components/common/NoDataState'
import { ReportFormat, ReportItem, ReportType } from '@/lib/types'

// ─── helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<ReportType, string> = {
  logs: '로그',
  metrics: '메트릭',
  traces: '트레이스',
  incident: '인시던트',
}

const TYPE_COLOR: Record<ReportType, 'primary' | 'secondary' | 'info' | 'error'> = {
  logs: 'primary',
  metrics: 'info',
  traces: 'secondary',
  incident: 'error',
}

const STATUS_LABEL: Record<string, string> = {
  draft: '초안',
  generating: '생성 중',
  completed: '완료',
  failed: '실패',
}

const STATUS_COLOR: Record<string, 'default' | 'warning' | 'success' | 'error'> = {
  draft: 'default',
  generating: 'warning',
  completed: 'success',
  failed: 'error',
}

const FORMAT_LABEL: Record<ReportFormat, string> = {
  pdf: 'PDF',
  csv: 'CSV',
  json: 'JSON',
}

const ALL_SERVICES = [
  'api-gateway',
  'auth-service',
  'user-service',
  'payment-service',
  'notification-service',
  'database',
]

const toDatetimeLocal = (iso: string) => iso.slice(0, 16)

function formatPeriod(from: string, to: string) {
  const fmt = (s: string) =>
    new Date(s).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  return `${fmt(from)} ~ ${fmt(to)}`
}

// ─── Create Dialog ─────────────────────────────────────────────────────────────

interface CreateDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: {
    title: string
    type: ReportType
    format: ReportFormat
    periodFrom: string
    periodTo: string
    services: string[]
  }) => void
  loading: boolean
}

function CreateReportDialog({ open, onClose, onSubmit, loading }: CreateDialogProps) {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [title, setTitle] = useState('')
  const [type, setType] = useState<ReportType>('logs')
  const [format, setFormat] = useState<ReportFormat>('pdf')
  const [periodFrom, setPeriodFrom] = useState(toDatetimeLocal(weekAgo.toISOString()))
  const [periodTo, setPeriodTo] = useState(toDatetimeLocal(now.toISOString()))
  const [services, setServices] = useState<string[]>([])

  const handleServiceChange = (e: SelectChangeEvent<string[]>) => {
    const val = e.target.value
    setServices(typeof val === 'string' ? val.split(',') : val)
  }

  const handleSubmit = () => {
    if (!title.trim() || services.length === 0) return
    onSubmit({
      title: title.trim(),
      type,
      format,
      periodFrom: new Date(periodFrom).toISOString(),
      periodTo: new Date(periodTo).toISOString(),
      services,
    })
  }

  const isValid = title.trim().length > 0 && services.length > 0 && periodFrom && periodTo

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>새 보고서 만들기</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="보고서 제목"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="예: 3월 1주차 로그 보고서"
            fullWidth
            required
          />

          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel>유형</InputLabel>
              <Select
                value={type}
                label="유형"
                onChange={e => setType(e.target.value as ReportType)}
              >
                {(Object.keys(TYPE_LABEL) as ReportType[]).map(t => (
                  <MenuItem key={t} value={t}>
                    {TYPE_LABEL[t]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>형식</InputLabel>
              <Select
                value={format}
                label="형식"
                onChange={e => setFormat(e.target.value as ReportFormat)}
              >
                {(Object.keys(FORMAT_LABEL) as ReportFormat[]).map(f => (
                  <MenuItem key={f} value={f}>
                    {FORMAT_LABEL[f]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              label="시작 시각"
              type="datetime-local"
              value={periodFrom}
              onChange={e => setPeriodFrom(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="종료 시각"
              type="datetime-local"
              value={periodTo}
              onChange={e => setPeriodTo(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          <FormControl fullWidth required>
            <InputLabel>서비스</InputLabel>
            <Select
              multiple
              value={services}
              onChange={handleServiceChange}
              input={<OutlinedInput label="서비스" />}
              renderValue={selected => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map(v => (
                    <Chip key={v} label={v} size="small" />
                  ))}
                </Box>
              )}
            >
              {ALL_SERVICES.map(svc => (
                <MenuItem key={svc} value={svc}>
                  {svc}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          취소
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!isValid || loading}>
          {loading ? '생성 중...' : '보고서 생성'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Detail Dialog ─────────────────────────────────────────────────────────────

interface DetailDialogProps {
  report: ReportItem | null
  onClose: () => void
  onDelete: (id: string) => void
  deleteLoading: boolean
}

function ReportDetailDialog({ report, onClose, onDelete, deleteLoading }: DetailDialogProps) {
  if (!report) return null

  const summary = report.summary ?? {}

  return (
    <Dialog open={!!report} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={700}>
            {report.title}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Chip label={TYPE_LABEL[report.type]} color={TYPE_COLOR[report.type]} size="small" />
            <Chip
              label={STATUS_LABEL[report.status]}
              color={STATUS_COLOR[report.status]}
              size="small"
            />
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2}>
          {/* Basic info */}
          <Box
            sx={{
              bgcolor: theme =>
                theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'grey.50',
              borderRadius: 1,
              p: 2,
            }}
          >
            <Stack spacing={1}>
              <InfoRow label="기간" value={formatPeriod(report.period.from, report.period.to)} />
              <InfoRow label="형식" value={FORMAT_LABEL[report.format]} />
              <InfoRow label="서비스" value={report.services.join(', ')} />
              <InfoRow label="생성자" value={report.createdBy} />
              <InfoRow label="생성 요청" value={formatDateTime(report.createdAt)} />
              {report.completedAt && (
                <InfoRow label="완료 시각" value={formatDateTime(report.completedAt)} />
              )}
              {report.fileSize && <InfoRow label="파일 크기" value={report.fileSize} />}
            </Stack>
          </Box>

          {/* Summary */}
          {report.status === 'completed' && Object.keys(summary).length > 0 && (
            <>
              <Divider />
              <Typography variant="subtitle2" fontWeight={600}>
                요약
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1.5}>
                {summary.totalRecords !== undefined && (
                  <SummaryCard label="전체 레코드" value={summary.totalRecords.toLocaleString()} />
                )}
                {summary.errorCount !== undefined && (
                  <SummaryCard
                    label="에러"
                    value={summary.errorCount.toLocaleString()}
                    color="error.main"
                  />
                )}
                {summary.warningCount !== undefined && (
                  <SummaryCard
                    label="경고"
                    value={summary.warningCount.toLocaleString()}
                    color="warning.main"
                  />
                )}
                {summary.avgDurationMs !== undefined && (
                  <SummaryCard label="평균 지연" value={`${summary.avgDurationMs} ms`} />
                )}
                {summary.p99DurationMs !== undefined && (
                  <SummaryCard label="P99 지연" value={`${summary.p99DurationMs} ms`} />
                )}
                {summary.topService && (
                  <SummaryCard label="최다 서비스" value={summary.topService} />
                )}
              </Stack>
            </>
          )}

          {report.status === 'generating' && (
            <Alert severity="info">보고서를 생성하고 있습니다. 잠시 후 완료됩니다.</Alert>
          )}

          {report.status === 'failed' && (
            <Alert severity="error">보고서 생성에 실패했습니다. 다시 시도해 주세요.</Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => onDelete(report.id)}
          disabled={deleteLoading}
        >
          삭제
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>닫기</Button>
        {report.status === 'completed' && (
          <Button variant="contained" startIcon={<DownloadIcon />}>
            다운로드
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" gap={2}>
      <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ textAlign: 'right', wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Stack>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        px: 2,
        py: 1.5,
        minWidth: 120,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="subtitle1"
        fontWeight={700}
        sx={{ color: color ?? 'text.primary', lineHeight: 1.2, mt: 0.5 }}
      >
        {value}
      </Typography>
    </Box>
  )
}

// ─── Report Card Item ──────────────────────────────────────────────────────────

function ReportRow({ report, onClick }: { report: ReportItem; onClick: () => void }) {
  return (
    <Card
      variant="outlined"
      sx={{
        cursor: 'pointer',
        transition: 'box-shadow 0.15s',
        '&:hover': { boxShadow: 3 },
      }}
      onClick={onClick}
    >
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
          gap={1}
        >
          {/* Left: icon + title + meta */}
          <Stack direction="row" alignItems="center" gap={1.5} sx={{ flex: 1, minWidth: 0 }}>
            <ReportIcon
              sx={{
                color: theme => theme.palette[TYPE_COLOR[report.type]].main,
                flexShrink: 0,
              }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="body1"
                fontWeight={600}
                sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {report.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatPeriod(report.period.from, report.period.to)}
                {' · '}
                {report.services.length}개 서비스
                {report.fileSize ? ` · ${report.fileSize}` : ''}
              </Typography>
            </Box>
          </Stack>

          {/* Right: chips */}
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            <Chip label={TYPE_LABEL[report.type]} color={TYPE_COLOR[report.type]} size="small" />
            <Chip label={FORMAT_LABEL[report.format]} size="small" variant="outlined" />
            <Chip
              label={STATUS_LABEL[report.status]}
              color={STATUS_COLOR[report.status]}
              size="small"
            />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null)
  const [filterType, setFilterType] = useState<ReportType | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const {
    data: reports = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['reports'],
    queryFn: apiClient.getReports,
  })

  const createMutation = useMutation({
    mutationFn: apiClient.createReport,
    onSuccess: newReport => {
      queryClient.setQueryData<ReportItem[]>(['reports'], (prev = []) => [newReport, ...prev])
      setCreateOpen(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: apiClient.deleteReport,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<ReportItem[]>(['reports'], (prev = []) =>
        prev.filter(r => r.id !== deletedId)
      )
      setSelectedReport(null)
    },
  })

  const filtered = reports.filter(r => {
    if (filterType !== 'all' && r.type !== filterType) return false
    if (filterStatus !== 'all' && r.status !== filterStatus) return false
    return true
  })

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 1.5, sm: 2, md: 3 },
        height: '100%',
        minHeight: 0,
      }}
    >
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ sm: 'center' }}
        gap={1}
      >
        <Typography variant="h4" fontWeight={700}>
          보고서
        </Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="새로고침">
            <IconButton onClick={() => refetch()} disabled={isRefetching} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            size="small"
          >
            새 보고서
          </Button>
        </Stack>
      </Stack>

      {/* Filters */}
      <Stack direction="row" spacing={1.5} flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>유형</InputLabel>
          <Select
            value={filterType}
            label="유형"
            onChange={e => setFilterType(e.target.value as ReportType | 'all')}
          >
            <MenuItem value="all">전체</MenuItem>
            {(Object.keys(TYPE_LABEL) as ReportType[]).map(t => (
              <MenuItem key={t} value={t}>
                {TYPE_LABEL[t]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>상태</InputLabel>
          <Select value={filterStatus} label="상태" onChange={e => setFilterStatus(e.target.value)}>
            <MenuItem value="all">전체</MenuItem>
            {Object.keys(STATUS_LABEL).map(s => (
              <MenuItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          {filtered.length}개 보고서
        </Typography>
      </Stack>

      {/* List */}
      <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {isLoading ? (
          <Stack spacing={1.5}>
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} variant="rounded" height={72} />
            ))}
          </Stack>
        ) : filtered.length === 0 ? (
          <NoDataState
            title="보고서가 없습니다"
            description="새 보고서를 만들어 로그, 메트릭, 트레이스 데이터를 정리해 보세요."
          />
        ) : (
          <Stack spacing={1.5}>
            {filtered.map(r => (
              <ReportRow key={r.id} report={r} onClick={() => setSelectedReport(r)} />
            ))}
          </Stack>
        )}
      </Box>

      {/* Create Dialog */}
      <CreateReportDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={payload => createMutation.mutate(payload)}
        loading={createMutation.isPending}
      />

      {/* Detail Dialog */}
      <ReportDetailDialog
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onDelete={id => deleteMutation.mutate(id)}
        deleteLoading={deleteMutation.isPending}
      />
    </Box>
  )
}
