'use client'

import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Button,
} from '@mui/material'
import { ArrowRight as ArrowRightIcon } from '@mui/icons-material'
import KPICard from '@/components/KPICard'
import { formatTimestamp } from '@/lib/formatters'
import { mockMetrics, mockLogs, mockServices, mockAlertEvents } from '@/lib/mock'

export default function OverviewPage() {
  // Get latest metrics
  const errorRateMetric = mockMetrics.find(m => m.name === 'Error Rate')
  const latencyMetric = mockMetrics.find(m => m.name === 'Latency P95')
  const throughputMetric = mockMetrics.find(m => m.name === 'Throughput')

  const latestErrorRate = errorRateMetric?.points[errorRateMetric.points.length - 1]?.value || 0
  const latestLatency = latencyMetric?.points[latencyMetric.points.length - 1]?.value || 0
  const latestThroughput = throughputMetric?.points[throughputMetric.points.length - 1]?.value || 0

  // Service health
  const healthyServices = mockServices.filter(s => s.status === 'healthy').length
  const degradedServices = mockServices.filter(s => s.status === 'degraded').length

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Dashboard Overview
        </Typography>
        <Typography variant="body2" sx={{ color: theme => theme.palette.text.secondary }}>
          Real-time health and performance metrics of your services
        </Typography>
      </Box>

      {/* KPI Cards Section */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2 }}>
        {/* Error Rate */}
        <Grid item xs={12} sm={6} md={6} lg={3}>
          <KPICard
            title="Error Rate"
            value={latestErrorRate}
            unit="%"
            status={latestErrorRate > 5 ? 'critical' : latestErrorRate > 2 ? 'warning' : 'healthy'}
            trend={{
              value: 12,
              direction: 'up' as const,
              timeRange: 'from 1h ago',
            }}
            tooltip="Percentage of failed requests in last hour"
            onClick={() => {
              window.location.href = '/logs?level=ERROR'
            }}
          />
        </Grid>

        {/* Latency P95 */}
        <Grid item xs={12} sm={6} md={6} lg={3}>
          <KPICard
            title="Latency P95"
            value={latestLatency}
            unit="ms"
            status={latestLatency > 1000 ? 'critical' : latestLatency > 500 ? 'warning' : 'healthy'}
            trend={{
              value: 5,
              direction: 'down' as const,
              timeRange: 'from 1h ago',
            }}
            tooltip="95th percentile response time"
          />
        </Grid>

        {/* Throughput */}
        <Grid item xs={12} sm={6} md={6} lg={3}>
          <KPICard
            title="Throughput"
            value={latestThroughput}
            unit="req/s"
            status="healthy"
            tooltip="Requests per second across all services"
          />
        </Grid>

        {/* Service Health */}
        <Grid item xs={12} sm={6} md={6} lg={3}>
          <KPICard
            title="Service Health"
            value={`${healthyServices}/${mockServices.length}`}
            status={degradedServices > 0 ? 'warning' : 'healthy'}
            tooltip={`${healthyServices} healthy, ${degradedServices} degraded`}
            onClick={() => {
              window.location.href = '/settings'
            }}
          />
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2 }}>
        {/* Top Services Table */}
        <Grid item xs={12} md={12} lg={8}>
          <Card
            sx={{
              bgcolor: theme => (theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff'),
              border: '1px solid',
              borderColor: theme => theme.palette.divider,
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Services Overview
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowRightIcon />}
                  sx={{
                    color: theme => theme.palette.primary.light,
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    '&:hover': {
                      color: theme => theme.palette.primary.main,
                    },
                  }}
                  onClick={() => {
                    window.location.href = '/logs'
                  }}
                >
                  View All
                </Button>
              </Box>

              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 500 }}>
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
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          padding: '10px 12px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Service
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          color: theme => theme.palette.text.primary,
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          padding: '10px 12px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Status
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          color: theme => theme.palette.text.primary,
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          padding: '10px 12px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Instances
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          color: theme => theme.palette.text.primary,
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          padding: '10px 12px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Error Rate
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockServices.slice(0, 6).map(service => {
                      const statusColors: Record<string, { bg: string; text: string }> = {
                        healthy: {
                          bg: 'rgba(16, 185, 129, 0.1)',
                          text: '#10b981',
                        },
                        degraded: {
                          bg: 'rgba(251, 191, 36, 0.1)',
                          text: '#fbbf24',
                        },
                        down: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' },
                        unknown: {
                          bg: 'rgba(107, 114, 128, 0.1)',
                          text: '#6b7280',
                        },
                      }
                      const color = statusColors[service.status]

                      return (
                        <TableRow
                          key={service.name}
                          onClick={() => {
                            window.location.href = `/logs?service=${service.name}`
                          }}
                          sx={{
                            borderBottom: '1px solid',
                            borderColor: theme => theme.palette.divider,
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: theme =>
                                theme.palette.mode === 'dark' ? '#1e293b' : '#f5f9fc',
                            },
                          }}
                        >
                          <TableCell
                            sx={{
                              color: theme => theme.palette.text.primary,
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              padding: '12px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {service.name}
                          </TableCell>
                          <TableCell align="center" sx={{ padding: '12px' }}>
                            <Chip
                              label={service.status}
                              size="small"
                              sx={{
                                bgcolor: color.bg,
                                color: color.text,
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            />
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              color: theme => theme.palette.text.primary,
                              fontSize: '0.875rem',
                              fontFamily: 'monospace',
                              padding: '12px',
                              fontWeight: 500,
                            }}
                          >
                            {service.instances}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              color: theme => theme.palette.text.primary,
                              fontSize: '0.875rem',
                              fontFamily: 'monospace',
                              padding: '12px',
                              fontWeight: 500,
                            }}
                          >
                            {(Math.random() * 5).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Alerts */}
        <Grid item xs={12} md={12} lg={4}>
          <Card
            sx={{
              bgcolor: theme => (theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff'),
              border: '1px solid',
              borderColor: theme => theme.palette.divider,
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Recent Alerts
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowRightIcon />}
                  sx={{
                    color: theme => theme.palette.primary.light,
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    '&:hover': {
                      color: theme => theme.palette.primary.main,
                    },
                  }}
                >
                  See All
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {mockAlertEvents.slice(0, 4).map(event => {
                  const severityColors: Record<
                    string,
                    { bg: string; text: string; borderColor: string }
                  > = {
                    info: {
                      bg: 'rgba(59, 130, 246, 0.1)',
                      text: '#3b82f6',
                      borderColor: '#1e40af',
                    },
                    warning: {
                      bg: 'rgba(251, 191, 36, 0.1)',
                      text: '#fbbf24',
                      borderColor: '#b45309',
                    },
                    error: {
                      bg: 'rgba(239, 68, 68, 0.1)',
                      text: '#ef4444',
                      borderColor: '#991b1b',
                    },
                    critical: {
                      bg: 'rgba(239, 68, 68, 0.1)',
                      text: '#ef4444',
                      borderColor: '#991b1b',
                    },
                  }
                  const color = severityColors[event.severity]

                  return (
                    <Card
                      key={event.id}
                      variant="outlined"
                      sx={{
                        bgcolor: theme => (theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc'),
                        borderLeft: `4px solid ${color.borderColor}`,
                        borderTop: 'none',
                        borderRight: 'none',
                        borderBottom: 'none',
                        borderColor: 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: theme => (theme.palette.mode === 'dark' ? '#334155' : '#eef2f7'),
                        },
                      }}
                    >
                      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 700,
                              color: theme => theme.palette.text.primary,
                              fontSize: '0.8rem',
                            }}
                          >
                            {event.alertName}
                          </Typography>
                          <Chip
                            label={event.severity}
                            size="small"
                            sx={{
                              bgcolor: color.bg,
                              color: color.text,
                              fontWeight: 600,
                              fontSize: '0.65rem',
                            }}
                          />
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme => theme.palette.text.secondary,
                            display: 'block',
                            mb: 0.5,
                            fontSize: '0.75rem',
                            lineHeight: 1.4,
                          }}
                        >
                          {event.message}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme => theme.palette.text.secondary,
                            fontFamily: 'monospace',
                            fontSize: '0.65rem',
                          }}
                        >
                          {formatTimestamp(event.timestamp)}
                        </Typography>
                      </CardContent>
                    </Card>
                  )
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Logs */}
      <Card
        sx={{
          bgcolor: theme => (theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff'),
          border: '1px solid',
          borderColor: theme => theme.palette.divider,
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Recent Logs
            </Typography>
            <Button
              size="small"
              endIcon={<ArrowRightIcon />}
              sx={{
                color: theme => theme.palette.primary.light,
                textTransform: 'none',
                fontSize: '0.875rem',
                '&:hover': {
                  color: theme => theme.palette.primary.main,
                },
              }}
              onClick={() => {
                window.location.href = '/logs'
              }}
            >
              View All Logs
            </Button>
          </Box>

          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{ borderBottom: '1px solid', borderColor: theme => theme.palette.divider }}
                >
                  <TableCell
                    sx={{
                      color: theme => theme.palette.text.primary,
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      padding: '10px 12px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Timestamp
                  </TableCell>
                  <TableCell
                    sx={{
                      color: theme => theme.palette.text.primary,
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      padding: '10px 12px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Service
                  </TableCell>
                  <TableCell
                    sx={{
                      color: theme => theme.palette.text.primary,
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      padding: '10px 12px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Level
                  </TableCell>
                  <TableCell
                    sx={{
                      color: theme => theme.palette.text.primary,
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      padding: '10px 12px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Message
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockLogs.slice(0, 4).map(log => {
                  const levelColors: Record<string, { bg: string; text: string }> = {
                    ERROR: {
                      bg: 'rgba(239, 68, 68, 0.1)',
                      text: '#ef4444',
                    },
                    WARN: {
                      bg: 'rgba(251, 191, 36, 0.1)',
                      text: '#fbbf24',
                    },
                    INFO: {
                      bg: 'rgba(59, 130, 246, 0.1)',
                      text: '#3b82f6',
                    },
                    DEBUG: {
                      bg: 'rgba(107, 114, 128, 0.1)',
                      text: '#6b7280',
                    },
                  }
                  const color = levelColors[log.level]

                  return (
                    <TableRow
                      key={log.id}
                      onClick={() => {
                        window.location.href = `/logs?service=${log.service}`
                      }}
                      sx={{
                        borderBottom: '1px solid',
                        borderColor: theme => theme.palette.divider,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: theme => (theme.palette.mode === 'dark' ? '#1e293b' : '#f5f9fc'),
                        },
                      }}
                    >
                      <TableCell
                        sx={{
                          color: theme => theme.palette.text.primary,
                          fontSize: '0.8rem',
                          fontFamily: 'monospace',
                          fontWeight: 500,
                          padding: '10px 12px',
                        }}
                      >
                        {formatTimestamp(log.timestamp)}
                      </TableCell>
                      <TableCell
                        sx={{
                          color: theme => theme.palette.text.primary,
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          padding: '10px 12px',
                        }}
                      >
                        {log.service}
                      </TableCell>
                      <TableCell sx={{ padding: '10px 12px' }}>
                        <Chip
                          label={log.level}
                          size="small"
                          sx={{
                            bgcolor: color.bg,
                            color: color.text,
                            fontWeight: 600,
                            fontSize: '0.75rem',
                          }}
                        />
                      </TableCell>
                      <TableCell
                        sx={{
                          color: theme => theme.palette.text.primary,
                          fontSize: '0.8rem',
                          maxWidth: 280,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          padding: '10px 12px',
                        }}
                      >
                        {log.message}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
