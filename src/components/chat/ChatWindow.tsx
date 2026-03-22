'use client'

import { AiMessage } from '@/lib/types'
import {
  Box,
  Card,
  CardContent,
  Chip,
  FormControlLabel,
  Switch,
  TextField,
  Button,
  Stack,
} from '@mui/material'
import { Send as SendIcon } from '@mui/icons-material'

type ChatWindowProps = {
  messages: AiMessage[]
  attachContext: boolean
  onToggleAttachContext: (value: boolean) => void
}

const suggestedPrompts = [
  'checkout 에러율 상승 원인 알려줘',
  '최근 1시간 동안 느린 endpoint 분석해줘',
  '로그와 trace를 함께 상관분석해줘',
]

export default function ChatWindow({
  messages,
  attachContext,
  onToggleAttachContext,
}: ChatWindowProps) {
  return (
    <Stack spacing={2}>
      {/* Messages */}
      <Card
        sx={{
          bgcolor: '#0f172a',
          border: '1px solid #1E293B',
          maxHeight: 400,
          overflowY: 'auto',
        }}
      >
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {messages.map(message => (
            <Box
              key={message.id}
              sx={{
                maxWidth: '80%',
                ml: message.role === 'user' ? 'auto' : 0,
                p: 1.5,
                borderRadius: 1,
                bgcolor: message.role === 'user' ? '#9333ea' : '#1e293b',
                color: '#e2e8f0',
              }}
            >
              <Box component="p" sx={{ fontSize: '0.875rem', m: 0 }}>
                {message.content}
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* Suggested Prompts */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {suggestedPrompts.map(prompt => (
          <Chip
            key={prompt}
            label={prompt}
            variant="outlined"
            size="small"
            sx={{
              borderColor: '#475569',
              color: '#cbd5e1',
              cursor: 'pointer',
              '&:hover': {
                borderColor: '#64748b',
                bgcolor: '#1e293b',
              },
            }}
          />
        ))}
      </Box>

      {/* Attach Context Toggle */}
      <FormControlLabel
        control={
          <Switch
            checked={attachContext}
            onChange={e => onToggleAttachContext(e.target.checked)}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: '#9333ea',
              },
            }}
          />
        }
        label="현재 페이지 컨텍스트 첨부"
        sx={{ color: '#cbd5e1' }}
      />

      {/* Input */}
      <Stack direction="row" spacing={1}>
        <TextField
          fullWidth
          placeholder="AI에게 질문을 입력하세요"
          size="small"
          multiline
          maxRows={3}
          sx={{
            bgcolor: '#1e293b',
            '& .MuiOutlinedInput-root': {
              color: '#cbd5e1',
              '& fieldset': {
                borderColor: '#334155',
              },
              '&:hover fieldset': {
                borderColor: '#475569',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#c084fc',
              },
            },
          }}
        />
        <Button
          variant="contained"
          sx={{
            bgcolor: '#9333ea',
            '&:hover': {
              bgcolor: '#7e22ce',
            },
          }}
        >
          <SendIcon />
        </Button>
      </Stack>
    </Stack>
  )
}
