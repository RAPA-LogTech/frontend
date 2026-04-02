// [런북 기능 추가] 런북 업로드 다이얼로그 — 파일 업로드 또는 텍스트 입력
// BFF → runbook-service (8082) → S3 + DynamoDB + Bedrock KB 동기화
'use client'

import { ChangeEvent, useRef, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'

type RunbookUploadProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function RunbookUpload({ open, onClose, onSuccess }: RunbookUploadProps) {
  const [tab, setTab] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [fileName, setFileName] = useState('new-runbook.md')
  const [textContent, setTextContent] = useState(
    '# Runbook Title\n\n## Summary\nDescribe when to use this runbook.\n\n## Steps\n1. Step one\n2. Step two\n'
  )

  const uploadFile = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', file.name.replace(/\.md$/i, ''))
      const res = await fetch('/api/runbooks', { method: 'POST', body: formData })
      if (res.ok) { onSuccess(); onClose() }
      else {
        const data = await res.json().catch(() => ({}))
        setError((data as Record<string, string>).detail ?? 'Upload failed')
      }
    } catch { setError('Upload failed') }
    finally { setUploading(false) }
  }

  const uploadText = async () => {
    if (!fileName.trim() || !textContent.trim()) { setError('Filename and content are required'); return }
    setUploading(true)
    setError(null)
    try {
      const blob = new Blob([textContent], { type: 'text/markdown' })
      const file = new File([blob], fileName.endsWith('.md') ? fileName : `${fileName}.md`, { type: 'text/markdown' })
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', fileName.replace(/\.md$/i, ''))
      const res = await fetch('/api/runbooks', { method: 'POST', body: formData })
      if (res.ok) { onSuccess(); onClose() }
      else {
        const data = await res.json().catch(() => ({}))
        setError((data as Record<string, string>).detail ?? 'Upload failed')
      }
    } catch { setError('Upload failed') }
    finally { setUploading(false) }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 700 }}>Upload Runbook</DialogTitle>
      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Upload File" sx={{ textTransform: 'none' }} />
          <Tab label="Write Text" sx={{ textTransform: 'none' }} />
        </Tabs>
        {tab === 0 && (
          <Stack gap={2} alignItems="center" sx={{ py: 3 }}>
            <Typography variant="body2" color="text.secondary">Select a markdown (.md) file to upload</Typography>
            <Button variant="outlined" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Choose File'}
            </Button>
            <input ref={fileInputRef} type="file" accept=".md,.markdown,text/markdown" style={{ display: 'none' }} onChange={handleFileChange} />
          </Stack>
        )}
        {tab === 1 && (
          <Stack gap={1.5} sx={{ mt: 1 }}>
            <TextField label="Filename" size="small" value={fileName} onChange={e => setFileName(e.target.value)} placeholder="e.g. db-failure-response.md" />
            <TextField label="Markdown Content" multiline minRows={12} value={textContent} onChange={e => setTextContent(e.target.value)} />
          </Stack>
        )}
        {error && <Typography variant="body2" color="error" sx={{ mt: 1 }}>{error}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        {tab === 1 && (
          <Button onClick={uploadText} variant="contained" disabled={uploading} sx={{ textTransform: 'none' }}>
            {uploading ? 'Uploading...' : 'Save'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
