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

      <Card sx={{ bgcolor: (theme) => theme.palette.background.paper, border: '1px solid', borderColor: (theme) => theme.palette.divider }}>
        <CardContent>
          <Stack spacing={2}>
            <Alert
              severity="info"
              variant="outlined"
              sx={{
                bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff',
                color: (theme) => theme.palette.info.main,
                borderColor: (theme) => theme.palette.info.dark,
                '& .MuiAlert-icon': {
                  color: (theme) => theme.palette.info.main,
                },
              }}
            >
              Connection Status: Mock Connected
            </Alert>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                sx={{
                  bgcolor: (theme) => theme.palette.primary.main,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: (theme) => theme.palette.primary.dark,
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
                  color: (theme) => theme.palette.text.secondary,
                  borderColor: (theme) => theme.palette.divider,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: (theme) => theme.palette.action.hover,
                    borderColor: (theme) => theme.palette.primary.main,
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
                    color: (theme) => theme.palette.text.primary,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: (theme) => theme.palette.divider,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: (theme) => theme.palette.divider,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: (theme) => theme.palette.primary.main,
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
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff',
                  color: (theme) => theme.palette.success.main,
                  borderColor: (theme) => theme.palette.success.dark,
                  '& .MuiAlert-icon': {
                    color: (theme) => theme.palette.success.main,
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
