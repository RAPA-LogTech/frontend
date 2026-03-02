'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';

export default function SettingsPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
        Settings
      </Typography>

      <Card sx={{ bgcolor: '#0f172a', border: '1px solid #1E293B' }}>
        <CardContent>
          <Tabs
            value={tab}
            onChange={(e, newValue) => setTab(newValue)}
            sx={{
              borderBottom: '1px solid #1E293B',
              mb: 2,
              '& .MuiTab-root': {
                textTransform: 'none',
                color: '#64748b',
                '&.Mui-selected': {
                  color: '#c084fc',
                  borderBottom: '2px solid #c084fc',
                },
              },
            }}
          >
            <Tab label="Organization" />
            <Tab label="Members" />
            <Tab label="API Keys" />
          </Tabs>

          {/* Organization Tab */}
          {tab === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  Organization Name
                </Typography>
                <TextField
                  fullWidth
                  defaultValue="LogTech"
                  size="small"
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
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  Timezone
                </Typography>
                <TextField
                  fullWidth
                  defaultValue="Asia/Seoul"
                  size="small"
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
              </Box>
              <Button
                variant="contained"
                sx={{
                  bgcolor: '#9333ea',
                  textTransform: 'none',
                  width: 'fit-content',
                  '&:hover': {
                    bgcolor: '#7e22ce',
                  },
                }}
              >
                Save Organization
              </Button>
            </Box>
          )}

          {/* Members Tab */}
          {tab === 1 && (
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
                      Role
                    </TableCell>
                    <TableCell
                      sx={{
                        color: '#cbd5e1',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                      }}
                    >
                      Email
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow
                    sx={{
                      borderBottom: '1px solid #1E293B',
                      '&:hover': {
                        bgcolor: '#1e293b',
                      },
                    }}
                  >
                    <TableCell sx={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                      Kim SRE
                    </TableCell>
                    <TableCell sx={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                      Admin
                    </TableCell>
                    <TableCell sx={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                      kim@logtech.io
                    </TableCell>
                  </TableRow>
                  <TableRow
                    sx={{
                      borderBottom: '1px solid #1E293B',
                      '&:hover': {
                        bgcolor: '#1e293b',
                      },
                    }}
                  >
                    <TableCell sx={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                      Park Dev
                    </TableCell>
                    <TableCell sx={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                      Member
                    </TableCell>
                    <TableCell sx={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                      park@logtech.io
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          )}

          {/* API Keys Tab */}
          {tab === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                        Key Name
                      </TableCell>
                      <TableCell
                        sx={{
                          color: '#cbd5e1',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                        }}
                      >
                        Created
                      </TableCell>
                      <TableCell
                        sx={{
                          color: '#cbd5e1',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                        }}
                      >
                        Last Used
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow
                      sx={{
                        borderBottom: '1px solid #1E293B',
                        '&:hover': {
                          bgcolor: '#1e293b',
                        },
                      }}
                    >
                      <TableCell sx={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                        gateway-readonly
                      </TableCell>
                      <TableCell sx={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                        2026-02-01
                      </TableCell>
                      <TableCell sx={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                        2026-03-01
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
              <Button
                variant="outlined"
                sx={{
                  color: '#cbd5e1',
                  borderColor: '#475569',
                  textTransform: 'none',
                  width: 'fit-content',
                  '&:hover': {
                    bgcolor: '#1e293b',
                    borderColor: '#64748b',
                  },
                }}
              >
                Create API Key
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
