// [런북 기능 추가] 런북 내용 표시 — S3에서 가져온 마크다운 원본 렌더링
'use client'

import { Box, Typography } from '@mui/material'

type RunbookViewerProps = {
  content: string
  title: string
}

export default function RunbookViewer({ content, title }: RunbookViewerProps) {
  return (
    <Box>
      {title && <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>{title}</Typography>}
      <Box sx={{
        bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
        borderRadius: 1, border: '1px solid', borderColor: 'divider', p: 3,
        fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: 1.7,
        whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowX: 'auto', color: 'text.primary',
      }}>
        {content}
      </Box>
    </Box>
  )
}
