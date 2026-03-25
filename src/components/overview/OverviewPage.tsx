'use client'

import React, { useEffect, useState, useCallback } from 'react'
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
  Skeleton,
} from '@mui/material'
import { ArrowRight as ArrowRightIcon } from '@mui/icons-material'
import KPICard from '@/components/KPICard'
import { formatTimestamp } from '@/lib/formatters'
import { apiClient, OverviewData } from '@/lib/apiClient'

// ─── Skeleton helpers ───

function KPISkeleton() {
  return (
    <Card>
      <CardContent>
        <Skeleton variant="text" width="60%" height={20} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" width={80} height={20} />
      </CardContent>
    </Card>
  )
}

function TableRowSkeleton({ cols }: { cols: number }) {
  return (
    <TableRow>
      {Array.from({ length: cols }).map((_, i) => (
        <TableCell key={i} sx={{ padding: '12px' }}>
          <Skeleton variant="text" />
        </TableCell>
      ))}
    </TableRow>
  )
}

function AlertSkeleton() {
  return (
    <Card variant="outlined" sx={{ borderLeft: '4px solid', borderColor: 'divider' }}>
      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
        <Skeleton variant="text" width="70%" height={18} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="90%" height={14} />
      </CardContent>
    </Card>
  )
}

// ─── Main ───

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const result = await apiClient.getOverview()
    setData(result)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const kpi = data?.kpi
  const services = data?.services ?? []
  const logs = data?.recent_logs ?? []

  const healthyCount = services.filter(s => s.error_rate < 0.05).length
  const degradedCount = services.filter(s => s.error_rate >= 0.05).length

  const statusColors: Record<string, { bg: string; text: string }> = {
    healthy: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' },
    degraded: { bg: 'rgba(251, 191, 36, 0.1)', text: '#fbbf24' },
  }

  const severityColors: Record<string, { bg: string; text: string; borderColor: string }> = {
    warning: { bg: 'rgba(251, 191, 36, 0.1)', text: '#fbbf24', borderColor: '#b45309' },
    error: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', borderColor: '#991b1b' },
    critical: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', borderColor: '#991b1b' },
  }

  const levelColors: Record<string, { bg: string; text: string }> = {
    ERROR: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' },
    WARN: { bg: 'rgba(251, 191, 36, 0.1)', text: '#fbbf24' },
    INFO: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' },
    DEBUG: { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280' },
  }

  const alerts = services
    .filter(s => s.error_rate >= 0.01)
    .sort((a, b) => b.error_rate - a.error_rate)
    .slice(0, 4)

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

      {/* KPI Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2 }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={6} lg={3} key={i}>
              <KPISkeleton />
            </Grid>
          ))
        ) : (
          <>
            <Grid item xs={12} sm={6} md={6} lg={3}>
              <KPICard
                title="Error Rate (avg)"
                value={(kpi?.error_rate ?? 0) * 100}
                unit="%"
                status={(kpi?.error_rate ?? 0) > 0.05 ? 'critical' : (kpi?.error_rate ?? 0) > 0.02 ? 'warning' : 'healthy'}
                tooltip="Average error rate across all services"
                onClick={() => { window.location.href = '/logs?level=ERROR' }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6} lg={3}>
              <KPICard
                title="Latency P95 (avg)"
                value={kpi?.latency_p95 ?? 0}
                unit="ms"
                status={(kpi?.latency_p95 ?? 0) > 1000 ? 'critical' : (kpi?.latency_p95 ?? 0) > 500 ? 'warning' : 'healthy'}
                tooltip="Average P95 latency across all services"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6} lg={3}>
              <KPICard
                title="Throughput (total)"
                value={kpi?.throughput ?? 0}
                unit="req/s"
                status="healthy"
                tooltip="Total requests per second across all services"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6} lg={3}>
              <KPICard
                title="Service Health"
                value={`${healthyCount}/${services.length}`}
                status={degradedCount > 0 ? 'warning' : 'healthy'}
                tooltip={`${healthyCount} healthy, ${degradedCount} degraded`}
                onClick={() => { window.location.href = '/settings' }}
              />
            </Grid>
          </>
        )}
      </Grid>

      {/* Services + Alerts */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2 }}>
        {/* Services Table */}
        <Grid item xs={12} md={12} lg={8}>
          <Card sx={{ bgcolor: theme => (theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff'), border: '1px solid', borderColor: theme => theme.palette.divider }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Services Overview</Typography>
                <Button size="small" endIcon={<ArrowRightIcon />} sx={{ color: theme => theme.palette.primary.light, textTransform: 'none', fontSize: '0.875rem', '&:hover': { color: theme => theme.palette.primary.main } }} onClick={() => { window.location.href = '/logs' }}>
                  View All
                </Button>
              </Box>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 500 }}>
                  <TableHead>
                    <TableRow sx={{ borderBottom: '1px solid', borderColor: theme => theme.palette.divider }}>
                      {['Service', 'Status', 'Envs', 'Error Rate'].map((h, i) => (
                        <TableCell key={h} align={i > 0 ? 'center' : undefined} sx={{ color: theme => theme.palette.text.primary, fontWeight: 700, fontSize: '0.8rem', padding: '10px 12px', whiteSpace: 'nowrap' }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading
                      ? Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} cols={4} />)
                      : services.slice(0, 6).map(svc => {
                          const st = svc.error_rate >= 0.05 ? 'degraded' : 'healthy'
                          const c = statusColors[st]
                          return (
                            <TableRow key={svc.service} onClick={() => { window.location.href = `/logs?service=${svc.service}` }} sx={{ borderBottom: '1px solid', borderColor: theme => theme.palette.divider, cursor: 'pointer', '&:hover': { bgcolor: theme => theme.palette.mode === 'dark' ? '#1e293b' : '#f5f9fc' } }}>
                              <TableCell sx={{ color: theme => theme.palette.text.primary, fontSize: '0.875rem', fontWeight: 600, padding: '12px', whiteSpace: 'nowrap' }}>{svc.service}</TableCell>
                              <TableCell align="center" sx={{ padding: '12px' }}>
                                <Chip label={st} size="small" sx={{ bgcolor: c.bg, color: c.text, fontWeight: 600, fontSize: '0.75rem' }} />
                              </TableCell>
                              <TableCell align="center" sx={{ color: theme => theme.palette.text.primary, fontSize: '0.875rem', fontFamily: 'monospace', padding: '12px', fontWeight: 500 }}>{svc.envs.join(', ')}</TableCell>
                              <TableCell align="center" sx={{ color: theme => theme.palette.text.primary, fontSize: '0.875rem', fontFamily: 'monospace', padding: '12px', fontWeight: 500 }}>{(svc.error_rate * 100).toFixed(1)}%</TableCell>
                            </TableRow>
                          )
                        })}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Alerts */}
        <Grid item xs={12} md={12} lg={4}>
          <Card sx={{ bgcolor: theme => (theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff'), border: '1px solid', borderColor: theme => theme.palette.divider }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Recent Alerts</Typography>
                <Button size="small" endIcon={<ArrowRightIcon />} sx={{ color: theme => theme.palette.primary.light, textTransform: 'none', fontSize: '0.875rem', '&:hover': { color: theme => theme.palette.primary.main } }}>
                  See All
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => <AlertSkeleton key={i} />)
                ) : alerts.length > 0 ? (
                  alerts.map(svc => {
                    const sev = svc.error_rate >= 0.1 ? 'critical' : svc.error_rate >= 0.05 ? 'error' : 'warning'
                    const sc = severityColors[sev]
                    return (
                      <Card key={svc.service} variant="outlined" sx={{ bgcolor: theme => (theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc'), borderLeft: `4px solid ${sc.borderColor}`, borderTop: 'none', borderRight: 'none', borderBottom: 'none', borderColor: 'transparent', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { bgcolor: theme => (theme.palette.mode === 'dark' ? '#334155' : '#eef2f7') } }}>
                        <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: theme => theme.palette.text.primary, fontSize: '0.8rem' }}>
                              High Error Rate — {svc.service}
                            </Typography>
                            <Chip label={sev} size="small" sx={{ bgcolor: sc.bg, color: sc.text, fontWeight: 600, fontSize: '0.65rem' }} />
                          </Box>
                          <Typography variant="caption" sx={{ color: theme => theme.palette.text.secondary, display: 'block', fontSize: '0.75rem', lineHeight: 1.4 }}>
                            Error rate {(svc.error_rate * 100).toFixed(1)}% (envs: {svc.envs.join(', ')})
                          </Typography>
                        </CardContent>
                      </Card>
                    )
                  })
                ) : (
                  <Typography variant="body2" sx={{ color: theme => theme.palette.text.secondary, textAlign: 'center', py: 2 }}>
                    No alerts — all services healthy
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Logs */}
      <Card sx={{ bgcolor: theme => (theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff'), border: '1px solid', borderColor: theme => theme.palette.divider }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Recent Logs</Typography>
            <Button size="small" endIcon={<ArrowRightIcon />} sx={{ color: theme => theme.palette.primary.light, textTransform: 'none', fontSize: '0.875rem', '&:hover': { color: theme => theme.palette.primary.main } }} onClick={() => { window.location.href = '/logs' }}>
              View All Logs
            </Button>
          </Box>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ borderBottom: '1px solid', borderColor: theme => theme.palette.divider }}>
                  {['Timestamp', 'Service', 'Level', 'Message'].map(h => (
                    <TableCell key={h} sx={{ color: theme => theme.palette.text.primary, fontWeight: 700, fontSize: '0.8rem', padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} cols={4} />)
                  : logs.slice(0, 4).map(log => {
                      const lc = levelColors[log.level] ?? levelColors.INFO
                      return (
                        <TableRow key={log.id} onClick={() => { window.location.href = `/logs?service=${log.service}` }} sx={{ borderBottom: '1px solid', borderColor: theme => theme.palette.divider, cursor: 'pointer', '&:hover': { bgcolor: theme => (theme.palette.mode === 'dark' ? '#1e293b' : '#f5f9fc') } }}>
                          <TableCell sx={{ color: theme => theme.palette.text.primary, fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 500, padding: '10px 12px' }}>
                            {formatTimestamp(log.timestamp)}
                          </TableCell>
                          <TableCell sx={{ color: theme => theme.palette.text.primary, fontSize: '0.875rem', fontWeight: 600, padding: '10px 12px' }}>
                            {log.service}
                          </TableCell>
                          <TableCell sx={{ padding: '10px 12px' }}>
                            <Chip label={log.level} size="small" sx={{ bgcolor: lc.bg, color: lc.text, fontWeight: 600, fontSize: '0.75rem' }} />
                          </TableCell>
                          <TableCell sx={{ color: theme => theme.palette.text.primary, fontSize: '0.8rem', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '10px 12px' }}>
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
