'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { apiClient } from '@/lib/apiClient';

export default function DashboardsPage() {
  const { data: dashboards = [] } = useQuery({
    queryKey: ['dashboards'],
    queryFn: apiClient.getDashboards,
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Dashboards
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            bgcolor: '#9333ea',
            textTransform: 'none',
            '&:hover': {
              bgcolor: '#7e22ce',
            },
          }}
        >
          New Dashboard
        </Button>
      </Box>

      <Grid container spacing={2}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card sx={{ bgcolor: '#0f172a', border: '1px solid #1E293B' }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                  Widget #{index + 1}
                </Typography>
                <Box
                  sx={{
                    height: 120,
                    border: '2px dashed #334155',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#1e293b',
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Chart Placeholder
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ bgcolor: '#0f172a', border: '1px solid #1E293B' }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Dashboard List
          </Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ borderBottom: '1px solid #1E293B' }}>
                  <TableCell
                    sx={{
                      color: '#cbd5e1',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  >
                    Name
                  </TableCell>
                  <TableCell
                    sx={{
                      color: '#cbd5e1',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  >
                    Owner
                  </TableCell>
                  <TableCell
                    sx={{
                      color: '#cbd5e1',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  >
                    Updated
                  </TableCell>
                  <TableCell
                    sx={{
                      color: '#cbd5e1',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  >
                    Widgets
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dashboards.map((dashboard) => (
                  <TableRow
                    key={dashboard.id}
                    sx={{
                      borderBottom: '1px solid #1E293B',
                      '&:hover': {
                        bgcolor: '#1e293b',
                      },
                    }}
                  >
                    <TableCell sx={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                      {dashboard.name}
                    </TableCell>
                    <TableCell sx={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                      {dashboard.owner}
                    </TableCell>
                    <TableCell sx={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                      {dashboard.updatedAt}
                    </TableCell>
                    <TableCell sx={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                      {dashboard.widgets.length} widgets
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
