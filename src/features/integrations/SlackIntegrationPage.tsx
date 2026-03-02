'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Stack,
  Typography,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import { apiClient } from '@/lib/apiClient';

export default function SlackIntegrationPage() {
  const [channel, setChannel] = useState('#alerts');
  const mutation = useMutation({
    mutationFn: (targetChannel: string) =>
      apiClient.sendSlackTestMessage({
        channel: targetChannel,
        text: '[TEST] Observability alert pipeline health check',
      }),
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
        Slack Integration
      </Typography>

      <Card sx={{ bgcolor: '#0f172a', border: '1px solid #1E293B' }}>
        <CardContent>
          <Stack spacing={2}>
            <Alert
              severity="info"
              variant="outlined"
              sx={{
                bgcolor: '#0f172a',
                color: '#3b82f6',
                borderColor: '#1e40af',
                '& .MuiAlert-icon': {
                  color: '#3b82f6',
                },
              }}
            >
              Connection Status: Mock Connected
            </Alert>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                sx={{
                  bgcolor: '#9333ea',
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: '#7e22ce',
                  },
                }}
              >
                Connect Slack (Dummy)
              </Button>
              <Button
                variant="outlined"
                onClick={() => mutation.mutate(channel)}
                disabled={mutation.isPending}
                sx={{
                  color: '#cbd5e1',
                  borderColor: '#475569',
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: '#1e293b',
                    borderColor: '#64748b',
                  },
                  '&.Mui-disabled': {
                    opacity: 0.5,
                  },
                }}
              >
                Test Message
              </Button>
            </Box>

            <Box sx={{ maxWidth: 300 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                Channel
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  sx={{
                    bgcolor: '#1e293b',
                    color: '#cbd5e1',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#334155',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#475569',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#c084fc',
                    },
                  }}
                >
                  <MenuItem value="#alerts">#alerts</MenuItem>
                  <MenuItem value="#ops">#ops</MenuItem>
                  <MenuItem value="#sre-war-room">#sre-war-room</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {mutation.data?.ok && (
              <Alert
                severity="success"
                variant="outlined"
                sx={{
                  bgcolor: '#0f172a',
                  color: '#10b981',
                  borderColor: '#047857',
                  '& .MuiAlert-icon': {
                    color: '#10b981',
                  },
                }}
              >
                테스트 메시지 전송 완료: {mutation.data.channel}
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
