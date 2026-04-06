'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Box, Card, CardContent, Typography } from '@mui/material'
import { apiClient } from '@/lib/apiClient'
import SlackIncidentHistoryPanel from '@/components/notifications/SlackIncidentHistoryPanel'

type IncidentFilter = 'all' | 'ongoing' | 'analyzed' | 'resolved'

export default function NotificationsPage() {
  const integrationQuery = useQuery({
    queryKey: ['notifications-slack-integration-status'],
    queryFn: apiClient.getSlackIntegration,
  })

  const [incidentFilter, setIncidentFilter] = useState<IncidentFilter>('ongoing')

  const incidentsQuery = useQuery({
    queryKey: ['slack-incidents', incidentFilter],
    queryFn: () => apiClient.getSlackIncidents({ status: incidentFilter, limit: 80 }),
    refetchInterval: 30_000,
    staleTime: 15_000,
  })

  const incidentItems = incidentsQuery.data?.items ?? []

  const toSlackMessagePermalink = (slackTs?: string | null, slackChannel?: string | null) => {
    const teamDomainRaw = (integrationQuery.data?.teamDomain || '').trim().toLowerCase()
    const channelId = (slackChannel || '').trim() || integrationQuery.data?.channelId
    if (!channelId || !teamDomainRaw || !/^[a-z0-9-]+$/.test(teamDomainRaw)) return null
    const ts = (slackTs || '').trim()
    if (!/^\d+\.\d+$/.test(ts)) return `https://${teamDomainRaw}.slack.com/archives/${channelId}`
    const [secondsPart, microsPartRaw] = ts.split('.')
    const microsPart = (microsPartRaw || '').padEnd(6, '0').slice(0, 6)
    return `https://${teamDomainRaw}.slack.com/archives/${channelId}/p${secondsPart}${microsPart}`
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Slack 알람 이력</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Slack으로 전달된 알람 이력을 확인하고 상세 내용을 볼 수 있습니다.
        </Typography>
      </Box>
      <Card variant="outlined" sx={{ borderColor: 'divider' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <SlackIncidentHistoryPanel
            incidentFilter={incidentFilter}
            onIncidentFilterChange={setIncidentFilter}
            incidents={incidentItems}
            incidentsLoading={incidentsQuery.isLoading}
            incidentsErrorMessage={
              incidentsQuery.isError
                ? incidentsQuery.error instanceof Error
                  ? incidentsQuery.error.message
                  : 'Slack 알람 이력 조회에 실패했습니다.'
                : null
            }
            onOpenSlackMessage={(incident) => {
              const permalink = toSlackMessagePermalink(incident.slack_ts, incident.slack_channel)
              if (!permalink) {
                window.alert('Slack 링크를 만들 수 없습니다. teamDomain 또는 channelId를 확인해 주세요.')
                return
              }
              window.open(permalink, '_blank', 'noopener,noreferrer')
            }}
          />
        </CardContent>
      </Card>
    </Box>
  )
}
