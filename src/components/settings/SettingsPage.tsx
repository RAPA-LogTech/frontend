'use client'

import { useState } from 'react'
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
} from '@mui/material'

export default function SettingsPage() {
  const [tab, setTab] = useState(0)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
        Settings
      </Typography>

      <Card
        sx={{
          bgcolor: theme => theme.palette.background.paper,
          border: '1px solid',
          borderColor: theme => theme.palette.divider,
        }}
      >
        <CardContent>
          <Tabs
            value={tab}
            onChange={(e, newValue) => setTab(newValue)}
            sx={{
              borderBottom: '1px solid',
              borderColor: theme => theme.palette.divider,
              mb: 2,
              '& .MuiTab-root': {
                textTransform: 'none',
                color: theme => theme.palette.text.secondary,
                '&.Mui-selected': {
                  color: theme => theme.palette.primary.main,
                  borderBottom: theme => `2px solid ${theme.palette.primary.main}`,
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
                    '& .MuiOutlinedInput-root': {
                      color: theme => theme.palette.text.primary,
                      '& fieldset': {
                        borderColor: theme => theme.palette.divider,
                      },
                      '&:hover fieldset': {
                        borderColor: theme => theme.palette.divider,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: theme => theme.palette.primary.main,
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
                    '& .MuiOutlinedInput-root': {
                      color: theme => theme.palette.text.primary,
                      '& fieldset': {
                        borderColor: theme => theme.palette.divider,
                      },
                      '&:hover fieldset': {
                        borderColor: theme => theme.palette.divider,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: theme => theme.palette.primary.main,
                      },
                    },
                  }}
                />
              </Box>
              <Button
                variant="contained"
                sx={{
                  bgcolor: theme => theme.palette.primary.main,
                  textTransform: 'none',
                  width: 'fit-content',
                  '&:hover': {
                    bgcolor: theme => theme.palette.primary.dark,
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
                  <TableRow
                    sx={{ borderBottom: '1px solid', borderColor: theme => theme.palette.divider }}
                  >
                    <TableCell
                      sx={{
                        color: theme => theme.palette.text.primary,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                      }}
                    >
                      Name
                    </TableCell>
                    <TableCell
                      sx={{
                        color: theme => theme.palette.text.primary,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                      }}
                    >
                      Role
                    </TableCell>
                    <TableCell
                      sx={{
                        color: theme => theme.palette.text.primary,
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
                      borderBottom: '1px solid',
                      borderColor: theme => theme.palette.divider,
                      '&:hover': {
                        bgcolor: theme => theme.palette.action.hover,
                      },
                    }}
                  >
                    <TableCell
                      sx={{ color: theme => theme.palette.text.primary, fontSize: '0.875rem' }}
                    >
                      Kim SRE
                    </TableCell>
                    <TableCell
                      sx={{ color: theme => theme.palette.text.primary, fontSize: '0.875rem' }}
                    >
                      Admin
                    </TableCell>
                    <TableCell
                      sx={{ color: theme => theme.palette.text.primary, fontSize: '0.875rem' }}
                    >
                      kim@logtech.io
                    </TableCell>
                  </TableRow>
                  <TableRow
                    sx={{
                      borderBottom: '1px solid',
                      borderColor: theme => theme.palette.divider,
                      '&:hover': {
                        bgcolor: theme => theme.palette.action.hover,
                      },
                    }}
                  >
                    <TableCell
                      sx={{ color: theme => theme.palette.text.primary, fontSize: '0.875rem' }}
                    >
                      Park Dev
                    </TableCell>
                    <TableCell
                      sx={{ color: theme => theme.palette.text.primary, fontSize: '0.875rem' }}
                    >
                      Member
                    </TableCell>
                    <TableCell
                      sx={{ color: theme => theme.palette.text.primary, fontSize: '0.875rem' }}
                    >
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
                    <TableRow
                      sx={{
                        borderBottom: '1px solid',
                        borderColor: theme => theme.palette.divider,
                      }}
                    >
                      <TableCell
                        sx={{
                          color: theme => theme.palette.text.primary,
                          fontWeight: 600,
                          fontSize: '0.875rem',
                        }}
                      >
                        Key Name
                      </TableCell>
                      <TableCell
                        sx={{
                          color: theme => theme.palette.text.primary,
                          fontWeight: 600,
                          fontSize: '0.875rem',
                        }}
                      >
                        Created
                      </TableCell>
                      <TableCell
                        sx={{
                          color: theme => theme.palette.text.primary,
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
                        borderBottom: '1px solid',
                        borderColor: theme => theme.palette.divider,
                        '&:hover': {
                          bgcolor: theme => theme.palette.action.hover,
                        },
                      }}
                    >
                      <TableCell
                        sx={{ color: theme => theme.palette.text.primary, fontSize: '0.875rem' }}
                      >
                        gateway-readonly
                      </TableCell>
                      <TableCell
                        sx={{ color: theme => theme.palette.text.primary, fontSize: '0.875rem' }}
                      >
                        2026-02-01
                      </TableCell>
                      <TableCell
                        sx={{ color: theme => theme.palette.text.primary, fontSize: '0.875rem' }}
                      >
                        2026-03-01
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
              <Button
                variant="outlined"
                sx={{
                  color: theme => theme.palette.text.secondary,
                  borderColor: theme => theme.palette.divider,
                  textTransform: 'none',
                  width: 'fit-content',
                  '&:hover': {
                    bgcolor: theme => theme.palette.action.hover,
                    borderColor: theme => theme.palette.primary.main,
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
  )
}
