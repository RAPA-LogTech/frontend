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
          '& .MuiOutlinedInput-root': {
            color: (theme) => theme.palette.text.primary,
            '& fieldset': {
              borderColor: (theme) => theme.palette.divider,
            },
            '&:hover fieldset': {
              borderColor: (theme) => theme.palette.divider,
            },
            '&.Mui-focused fieldset': {
              borderColor: (theme) => theme.palette.primary.main,
            },
          },
        }}
      />

      <Grid container spacing={2}>
        {kpis.map((kpi) => (
          <Grid item xs={12} md={4} key={kpi.label}>
            <Card sx={{ bgcolor: (theme) => theme.palette.background.paper, border: '1px solid', borderColor: (theme) => theme.palette.divider }}>
              <CardContent>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: (theme) => theme.palette.text.secondary,
                    display: 'block',
                  }}
                >
                  {kpi.label}
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 'bold',
                    color: (theme) => theme.palette.text.primary,
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

      <Card sx={{ bgcolor: (theme) => theme.palette.background.paper, border: '1px solid', borderColor: (theme) => theme.palette.divider }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Chart Placeholder
          </Typography>
          <Box
            sx={{
              height: 280,
              border: '2px dashed',
              borderColor: (theme) => theme.palette.divider,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: (theme) => theme.palette.action.hover,
              p: 2,
            }}
          >
            <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary }}>
              {metrics.map((m) => m.name).join(', ')} series ready for chart
              integration.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
