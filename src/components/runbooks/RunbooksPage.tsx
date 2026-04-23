// [런북 기능 추가] 런북 관리 페이지 — runbook-service (8082) API 연동
// 업로드 → S3 저장 + DynamoDB 메타데이터 + Bedrock KB 자동 동기화
// 기존 로컬 파일 시스템 방식에서 S3/DynamoDB 백엔드 연동으로 변경
'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { CloudUpload as UploadIcon } from '@mui/icons-material'
import NoDataState from '@/components/common/NoDataState'
import RunbookList from '@/components/runbooks/RunbookList'
import RunbookUpload from '@/components/runbooks/RunbookUpload'

type RunbookItem = {
  runbook_id: string
  filename: string
  title: string
  updated_at: string
  tags?: string[]
}

type RunbooksResponse = {
  runbooks: RunbookItem[]
  total: number
}

export default function RunbooksPage() {
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState<{
    message: string
    severity: 'success' | 'info' | 'error'
  } | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)

  // [런북 기능 추가] 런북 목록 조회 — BFF 프록시 → runbook-service /v1/runbooks/
  const { data, isLoading, isFetched, refetch, isRefetching } = useQuery<RunbooksResponse>({
    queryKey: ['runbooks'],
    queryFn: async () => {
      const response = await fetch('/api/runbooks')
      if (!response.ok) return { runbooks: [], total: 0 }
      return (await response.json()) as RunbooksResponse
    },
  })

  const runbooks = data?.runbooks ?? []

  const filteredRunbooks = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return runbooks
    return runbooks.filter(item =>
      [item.filename, item.title, ...(item.tags ?? [])].join(' ').toLowerCase().includes(normalized)
    )
  }, [runbooks, query])

  const handleUploadSuccess = () => {
    refetch()
    setNotice({ message: 'Runbook uploaded successfully.', severity: 'success' })
  }

  const handleDeleteRequest = (runbookId: string, title: string) => {
    setDeleteTarget({ id: runbookId, title })
  }

  // [런북 기능 추가] 런북 삭제 — BFF 프록시 → runbook-service DELETE /v1/runbooks/{id}
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/runbooks/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        setNotice({ message: `"${deleteTarget.title}" deleted.`, severity: 'success' })
        refetch()
      } else {
        setNotice({ message: `Delete failed: ${res.statusText}`, severity: 'error' })
      }
    } catch {
      setNotice({ message: 'Delete failed.', severity: 'error' })
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
        gap={1.25}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Runbooks
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage runbook files. Uploaded to S3 and synced with Bedrock Knowledge Base.
          </Typography>
        </Box>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          gap={1}
          sx={{ width: { xs: '100%', md: 'auto' } }}
        >
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            Upload Runbook
          </Button>
          <Button
            variant="outlined"
            onClick={() => refetch()}
            sx={{ textTransform: 'none' }}
            disabled={isRefetching}
          >
            {isRefetching ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Stack>
      </Stack>

      {notice && (
        <Alert severity={notice.severity} onClose={() => setNotice(null)}>
          {notice.message}
        </Alert>
      )}

      <Card variant="outlined" sx={{ borderColor: 'divider' }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by filename, title, or tag"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </CardContent>
      </Card>

      {isLoading ? (
        <Stack gap={1.25}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={52} />
          ))}
        </Stack>
      ) : isFetched && runbooks.length === 0 ? (
        <NoDataState
          title="No runbooks"
          description="Click Upload Runbook to add a markdown file."
        />
      ) : filteredRunbooks.length === 0 ? (
        <NoDataState title="No results" description="No runbooks match your search." />
      ) : (
        <Card variant="outlined" sx={{ borderColor: 'divider' }}>
          <RunbookList data={filteredRunbooks} onDelete={handleDeleteRequest} />
        </Card>
      )}

      {/* [런북 기능 추가] 업로드 다이얼로그 — 파일 업로드 + 텍스트 입력 */}
      <RunbookUpload
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Runbook</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Delete &quot;{deleteTarget?.title}&quot;?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            sx={{ textTransform: 'none' }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
