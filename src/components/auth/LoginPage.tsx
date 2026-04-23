'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Stack,
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'

type Step = 'login' | 'new_password'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/'

  const [step, setStep] = useState<Step>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [session, setSession] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/cognito/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '로그인에 실패했습니다.')
        return
      }
      if (data.challenge === 'NEW_PASSWORD_REQUIRED') {
        setSession(data.session)
        setStep('new_password')
        return
      }
      router.replace(next)
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleNewPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== newPasswordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/cognito/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, newPassword, session }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '비밀번호 변경에 실패했습니다.')
        return
      }
      router.replace(next)
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          justifyContent="center"
          sx={{ mb: 4 }}
        >
          <Box
            component="img"
            src="/logo/android-chrome-192x192.png"
            alt="LogTech"
            sx={{ width: 40, height: 40 }}
          />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            LogTech
          </Typography>
        </Stack>

        <Card
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: t =>
              t.palette.mode === 'dark'
                ? '0 8px 32px rgba(0,0,0,0.4)'
                : '0 8px 32px rgba(0,0,0,0.08)',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {step === 'login' ? (
              <>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  로그인
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  LogTech Observability 대시보드에 접속합니다.
                </Typography>
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
                <Box component="form" onSubmit={handleLogin}>
                  <Stack spacing={2}>
                    <TextField
                      label="이메일 또는 사용자명"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      fullWidth
                      required
                      autoComplete="username"
                      autoFocus
                      size="small"
                    />
                    <TextField
                      label="비밀번호"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      fullWidth
                      required
                      autoComplete="current-password"
                      size="small"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => setShowPassword(v => !v)}
                              edge="end"
                            >
                              {showPassword ? (
                                <VisibilityOff fontSize="small" />
                              ) : (
                                <Visibility fontSize="small" />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={loading || !username || !password}
                      sx={{ mt: 1, py: 1.25, fontWeight: 600 }}
                    >
                      {loading ? <CircularProgress size={20} color="inherit" /> : '로그인'}
                    </Button>
                  </Stack>
                </Box>
              </>
            ) : (
              <>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  비밀번호 변경
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  임시 비밀번호를 사용 중입니다. 새 비밀번호를 설정해주세요.
                </Typography>
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
                <Box component="form" onSubmit={handleNewPassword}>
                  <Stack spacing={2}>
                    <TextField
                      label="새 비밀번호"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      fullWidth
                      required
                      autoFocus
                      size="small"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => setShowPassword(v => !v)}
                              edge="end"
                            >
                              {showPassword ? (
                                <VisibilityOff fontSize="small" />
                              ) : (
                                <Visibility fontSize="small" />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      label="새 비밀번호 확인"
                      type="password"
                      value={newPasswordConfirm}
                      onChange={e => setNewPasswordConfirm(e.target.value)}
                      fullWidth
                      required
                      size="small"
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={loading || !newPassword || !newPasswordConfirm}
                      sx={{ mt: 1, py: 1.25, fontWeight: 600 }}
                    >
                      {loading ? <CircularProgress size={20} color="inherit" /> : '비밀번호 변경'}
                    </Button>
                  </Stack>
                </Box>
              </>
            )}
          </CardContent>
        </Card>

        <Typography
          variant="caption"
          color="text.disabled"
          align="center"
          display="block"
          sx={{ mt: 3 }}
        >
          LogTech Observability Platform
        </Typography>
      </Box>
    </Box>
  )
}
