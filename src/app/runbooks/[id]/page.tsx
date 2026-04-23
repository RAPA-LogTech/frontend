// [런북 기능 추가] 런북 상세 페이지 — runbook-service (8082) /v1/runbooks/{id} API 연동
// 리스트에서 보기(눈 아이콘) 클릭 시 이 페이지로 이동
// S3에 저장된 마크다운 원본 내용 표시 + 삭제 기능
'use client'

import { use, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { ArrowBack as BackIcon, Delete as DeleteIcon } from '@mui/icons-material'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDateTime } from '@/lib/formatters'
import RunbookViewer from '@/components/runbooks/RunbookViewer'
import NoDataState from '@/components/common/NoDataState'

type RunbookDetail = {
  runbook_id: string
  filename: string
  title: string
  content: string
  updated_at: string
  created_at: string
  tags: string[]
  description: string
}

export default function RunbookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [notice, setNotice] = useState<{
    message: string
    severity: 'success' | 'error' | 'info'
  } | null>(null)

  const {
    data: runbook,
    isLoading,
    isFetched,
  } = useQuery<RunbookDetail | null>({
    queryKey: ['runbook-detail', id],
    queryFn: async () => {
      const response = await fetch(`/api/runbooks/${id}`)
      if (!response.ok) return null
      return (await response.json()) as RunbookDetail
    },
  })

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/runbooks/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setNotice({ message: 'Runbook deleted.', severity: 'success' })
        setTimeout(() => router.push('/runbooks'), 1000)
      } else {
        setNotice({ message: `Delete failed: ${res.statusText}`, severity: 'error' })
      }
    } catch {
      setNotice({ message: 'Delete failed.', severity: 'error' })
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Skeleton variant="rounded" height={40} width={200} />
        <Skeleton variant="rounded" height={32} />
        <Skeleton variant="rounded" height={400} />
      </Box>
    )
  }

  if (isFetched && !runbook) {
    return (
      <Box>
        <Button
          component={Link}
          href="/runbooks"
          startIcon={<BackIcon />}
          sx={{ textTransform: 'none', mb: 2 }}
        >
          Runbook List
        </Button>
        <NoDataState title="Runbook not found" description={`ID "${id}" does not exist.`} />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        gap={1}
      >
        <Button
          component={Link}
          href="/runbooks"
          startIcon={<BackIcon />}
          sx={{ textTransform: 'none', alignSelf: 'flex-start' }}
        >
          Runbook List
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => setDeleteDialogOpen(true)}
          sx={{ textTransform: 'none' }}
        >
          Delete
        </Button>
      </Stack>

      {notice && (
        <Alert severity={notice.severity} onClose={() => setNotice(null)}>
          {notice.message}
        </Alert>
      )}

      {runbook && (
        <Card variant="outlined" sx={{ borderColor: 'divider' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {runbook.title}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                <Chip label={runbook.filename} size="small" variant="outlined" />
                <Chip
                  label={`Updated: ${formatDateTime(runbook.updated_at)}`}
                  size="small"
                  variant="outlined"
                />
                {runbook.tags.map((tag: string) => (
                  <Chip key={tag} label={tag} size="small" color="primary" variant="outlined" />
                ))}
              </Stack>
            </Box>
            <Divider />
            <RunbookViewer content={runbook.content} title="" />
          </CardContent>
        </Card>
      )}

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Runbook</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Delete &quot;{runbook?.title}&quot;?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
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
