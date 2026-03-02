'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { apiClient } from '@/lib/apiClient';

export default function MetricsPage() {
  const { data: metrics = [] } = useQuery({
    queryKey: ['metrics'],
    queryFn: apiClient.getMetrics,
  });

  const kpis = [
    { label: 'Request Rate', value: '1.4k req/s' },
    { label: 'Error Rate', value: '0.82%' },
    { label: 'P95 Latency', value: '420ms' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
        Metrics
      </Typography>

      <TextField
        fullWidth
        placeholder="PromQL (Advanced)"
        defaultValue={
          'sum(rate(http_requests_total{service="checkout"}[5m])) by (status)'
        }
        size="small"
        sx={{
          bgcolor: '#0f172a',
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

      <Grid container spacing={2}>
        {kpis.map((kpi) => (
          <Grid item xs={12} md={4} key={kpi.label}>
            <Card sx={{ bgcolor: '#0f172a', border: '1px solid #1E293B' }}>
              <CardContent>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: '#64748b',
                    display: 'block',
                  }}
                >
                  {kpi.label}
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 'bold',
                    color: '#e2e8f0',
                    mt: 1,
                  }}
                >
                  {kpi.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ bgcolor: '#0f172a', border: '1px solid #1E293B' }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Chart Placeholder
          </Typography>
          <Box
            sx={{
              height: 280,
              border: '2px dashed #334155',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#1e293b',
              p: 2,
            }}
          >
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              {metrics.map((m) => m.name).join(', ')} series ready for chart
              integration.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
