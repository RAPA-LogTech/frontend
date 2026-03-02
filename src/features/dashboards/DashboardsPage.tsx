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
            bgcolor: (theme) => theme.palette.primary.main,
            textTransform: 'none',
            '&:hover': {
              bgcolor: (theme) => theme.palette.primary.dark,
            },
          }}
        >
          New Dashboard
        </Button>
      </Box>

      <Grid container spacing={2}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card sx={{ bgcolor: (theme) => theme.palette.background.paper, border: '1px solid', borderColor: (theme) => theme.palette.divider }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary, mb: 2 }}>
                  Widget #{index + 1}
                </Typography>
                <Box
                  sx={{
                    height: 120,
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
                    Chart Placeholder
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ bgcolor: (theme) => theme.palette.background.paper, border: '1px solid', borderColor: (theme) => theme.palette.divider }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Dashboard List
          </Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ borderBottom: '1px solid', borderColor: (theme) => theme.palette.divider }}>
                  <TableCell
                    sx={{
                      color: (theme) => theme.palette.text.primary,
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  >
                    Name
                  </TableCell>
                  <TableCell
                    sx={{
                      color: (theme) => theme.palette.text.primary,
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  >
                    Owner
                  </TableCell>
                  <TableCell
                    sx={{
                      color: (theme) => theme.palette.text.primary,
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  >
                    Updated
                  </TableCell>
                  <TableCell
                    sx={{
                      color: (theme) => theme.palette.text.primary,
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
                      borderBottom: '1px solid',
                      borderColor: (theme) => theme.palette.divider,
                      '&:hover': {
                        bgcolor: (theme) => theme.palette.action.hover,
                      },
                    }}
                  >
                    <TableCell sx={{ color: (theme) => theme.palette.text.primary, fontSize: '0.875rem' }}>
                      {dashboard.name}
                    </TableCell>
                    <TableCell sx={{ color: (theme) => theme.palette.text.primary, fontSize: '0.875rem' }}>
                      {dashboard.owner}
                    </TableCell>
                    <TableCell sx={{ color: (theme) => theme.palette.text.primary, fontSize: '0.875rem' }}>
                      {dashboard.updatedAt}
                    </TableCell>
                    <TableCell sx={{ color: (theme) => theme.palette.text.primary, fontSize: '0.875rem' }}>
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
