'use client'

import { useRouter } from 'next/navigation'
import { Box, Paper, Typography, Stack } from '@mui/material'
import DescriptionIcon from '@mui/icons-material/Description'
import CallSplitIcon from '@mui/icons-material/CallSplit'
import BarChartIcon from '@mui/icons-material/BarChart'
import ChatIcon from '@mui/icons-material/Chat'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import ExtensionIcon from '@mui/icons-material/Extension'
import type { LogEntry, Trace } from '@/lib/types'

interface Props {
  errorLogs: LogEntry[]
  traces: Trace[]
  serviceCount: number
  slackConnected: boolean
}

export default function PlatformNavCards({
  errorLogs,
  traces,
  serviceCount,
  slackConnected,
}: Props) {
  const router = useRouter()

  const cards = [
    {
      icon: <DescriptionIcon sx={{ fontSize: 22 }} />,
      label: 'Logs',
      href: '/logs',
      color: '#60a5fa',
      desc: 'Search & filter log streams',
      badge: errorLogs.length > 0 ? `${errorLogs.length} errors` : 'No errors',
      badgeColor: errorLogs.length > 0 ? '#f87171' : '#4ade80',
    },
    {
      icon: <CallSplitIcon sx={{ fontSize: 22 }} />,
      label: 'Traces',
      href: '/traces',
      color: '#a78bfa',
      desc: 'Distributed trace explorer',
      badge: `${traces.length} active`,
      badgeColor: '#a78bfa',
    },
    {
      icon: <BarChartIcon sx={{ fontSize: 22 }} />,
      label: 'Metrics',
      href: '/metrics',
      color: '#34d399',
      desc: 'AMP · Container · Host metrics',
      badge: `${serviceCount} services`,
      badgeColor: '#34d399',
    },
    {
      icon: <ChatIcon sx={{ fontSize: 22 }} />,
      label: 'AI Chat',
      href: '/ai/chat',
      color: '#f472b6',
      desc: 'Anomaly analysis with Bedrock',
      badge: 'Powered by AWS',
      badgeColor: '#f472b6',
    },
    {
      icon: <MenuBookIcon sx={{ fontSize: 22 }} />,
      label: 'Runbooks',
      href: '/runbooks',
      color: '#fbbf24',
      desc: 'Incident response playbooks',
      badge: 'Auto-suggested',
      badgeColor: '#fbbf24',
    },
    {
      icon: <ExtensionIcon sx={{ fontSize: 22 }} />,
      label: 'Integrations',
      href: '/settings/integrations',
      color: '#fb923c',
      desc: 'Slack · Webhook · Alerts',
      badge: slackConnected ? 'Slack connected ✓' : 'Setup required',
      badgeColor: slackConnected ? '#4ade80' : '#94a3b8',
    },
  ]

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        flex: '0 0 380px',
        minWidth: 0,
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Platform
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Navigate to any module
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
        {cards.map(card => (
          <Box
            key={card.href}
            onClick={() => router.push(card.href)}
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              cursor: 'pointer',
              transition: 'all 0.15s',
              '&:hover': {
                borderColor: card.color,
                bgcolor: `${card.color}0d`,
                transform: 'translateY(-2px)',
                boxShadow: `0 4px 12px ${card.color}22`,
              },
            }}
          >
            <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
              <Box sx={{ color: card.color }}>{card.icon}</Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {card.label}
              </Typography>
            </Stack>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mb: 0.75, lineHeight: 1.3 }}
            >
              {card.desc}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: card.badgeColor, fontWeight: 600, fontSize: 10 }}
            >
              {card.badge}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  )
}
