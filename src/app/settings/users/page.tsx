'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Button,
  TextField,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material'
import { PersonAdd as PersonAddIcon, Refresh as RefreshIcon } from '@mui/icons-material'

interface User {
  username: string
  email: string
  status: string
  enabled: boolean
  createdAt: string
}

function statusChipProps(status: string) {
  if (status === 'CONFIRMED') return { label: '활성', color: 'success' as const }
  if (status === 'FORCE_CHANGE_PASSWORD')
    return { label: '임시 비밀번호', color: 'warning' as const }
  return { label: status, color: 'default' as const }
}

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const { data, isLoading } = useQuery<{ users: User[] }>({
    queryKey: ['cognito-users'],
    queryFn: () => fetch('/api/users').then(r => r.json()),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tempPassword }),
      }).then(async r => {
        const text = await r.text()
        let d: { error?: string; ok?: boolean }
        try {
          d = JSON.parse(text)
        } catch {
          throw new Error(text || r.statusText)
        }
        if (!r.ok) throw new Error(d.error ?? r.statusText)
        return d
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cognito-users'] })
      setOpen(false)
      setEmail('')
      setTempPassword('')
      setFormError(null)
    },
    onError: (e: Error) => setFormError(e.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    createMutation.mutate()
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Users
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            대시보드 접근 계정을 관리합니다.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="새로고침">
            <IconButton
              size="small"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['cognito-users'] })}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            size="small"
            onClick={() => setOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            유저 추가
          </Button>
        </Stack>
      </Stack>

      <Box
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>이메일</TableCell>
              <TableCell>상태</TableCell>
              <TableCell>활성화</TableCell>
              <TableCell>생성일</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : (data?.users ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  등록된 유저가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              (data?.users ?? []).map(user => {
                const chip = statusChipProps(user.status)
                return (
                  <TableRow key={user.username} hover>
                    <TableCell>{user.email || user.username}</TableCell>
                    <TableCell>
                      <Chip size="small" label={chip.label} color={chip.color} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={user.enabled ? '활성' : '비활성'}
                        color={user.enabled ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>유저 추가</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2}>
              {formError && <Alert severity="error">{formError}</Alert>}
              <TextField
                label="이메일"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                fullWidth
                required
                size="small"
                autoFocus
              />
              <TextField
                label="임시 비밀번호"
                value={tempPassword}
                onChange={e => setTempPassword(e.target.value)}
                fullWidth
                required
                size="small"
                helperText="첫 로그인 시 변경을 요구합니다."
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none' }}>
              취소
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isPending || !email || !tempPassword}
              sx={{ textTransform: 'none' }}
            >
              {createMutation.isPending ? <CircularProgress size={18} color="inherit" /> : '추가'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}
