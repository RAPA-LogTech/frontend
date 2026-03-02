'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
} from '@mui/material';
import { apiClient } from '@/lib/apiClient';

export default function TracesPage() {
  const { data: traces = [] } = useQuery({ queryKey: ['traces'], queryFn: apiClient.getTraces });
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(traces[0]?.id ?? null);

  const selected = traces.find((trace) => trace.id === selectedTraceId) ?? traces[0];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
        Traces
      </Typography>

      <Grid container spacing={2}>
        {/* Trace List */}
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: (theme) => theme.palette.background.paper, border: '1px solid', borderColor: (theme) => theme.palette.divider }}>
            <CardContent>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  color: (theme) => theme.palette.text.primary,
                }}
              >
                Trace List
              </Typography>
              <List sx={{ p: 0 }}>
                {traces.map((trace, index) => (
                  <Box key={trace.id}>
                    <ListItemButton
                      selected={selectedTraceId === trace.id}
                      onClick={() => setSelectedTraceId(trace.id)}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        bgcolor:
                          selectedTraceId === trace.id
                            ? (theme) => theme.palette.primary.main + '20'
                            : 'transparent',
                        color:
                          selectedTraceId === trace.id
                            ? (theme) => theme.palette.text.primary
                            : (theme) => theme.palette.text.secondary,
                        '&:hover': {
                          bgcolor: (theme) => theme.palette.action.hover,
                        },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {trace.operation} ({trace.duration}ms)
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: (theme) => theme.palette.text.secondary }}>
                            {trace.service} · {trace.status}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                    {index < traces.length - 1 && (
                      <Divider sx={{ borderColor: (theme) => theme.palette.divider, my: 0.5 }} />
                    )}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Trace Details */}
        <Grid item xs={12} md={9}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Trace Detail Card */}
            <Card sx={{ bgcolor: (theme) => theme.palette.background.paper, border: '1px solid', borderColor: (theme) => theme.palette.divider }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Trace Detail
                </Typography>
                <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary, mb: 1 }}>
                  Trace ID: {selected?.id}
                </Typography>
                <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary, mb: 1 }}>
                  Service: {selected?.service}
                </Typography>
                <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary, mb: 1 }}>
                  Operation: {selected?.operation}
                </Typography>
                <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary, mb: 2 }}>
                  Duration: {selected?.duration}ms
                </Typography>

                <Box
                  sx={{
                    height: 180,
                    border: '2px dashed',
                    borderColor: (theme) => theme.palette.divider,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: (theme) => theme.palette.action.hover,
                  }}
                >
                  <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary }}>
                    Span Tree Placeholder
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Related Logs Card */}
            <Card sx={{ bgcolor: (theme) => theme.palette.background.paper, border: '1px solid', borderColor: (theme) => theme.palette.divider }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Related Logs
                </Typography>
                <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary, mb: 1 }}>
                  [10:30:21] Payment provider timeout after 3 retries
                </Typography>
                <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary }}>
                  [10:30:18] Upstream latency above threshold p95=1.4s
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
