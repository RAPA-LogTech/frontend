export const dynamic = 'force-dynamic'
export const revalidate = 0

const ALERT_SERVICE_URL = process.env.ALERT_SERVICE_URL || 'http://localhost:8082'

export async function GET() {
  try {
    const response = await fetch(`${ALERT_SERVICE_URL}/v1/slack/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Alert Service returned ${response.status}`)
    }

    const data = await response.json()
    return Response.json({
      oauthConfigured: Boolean(data.teamId || data.teamName || data.channelId || data.channelName),
      connected: Boolean(data.isConnected),
      teamId: data.teamId ?? null,
      teamName: data.teamName ?? null,
      teamDomain: data.teamDomain ?? null,
      teamImage: data.teamImage ?? null,
      channelId: data.channelId ?? null,
      channelName: data.channelName ?? null,
      webhookUrlMasked: data.webhookUrlMasked ?? null,
      installedBy: data.installedBy ?? null,
      installedAt: data.installedAt ?? null,
      updatedAt: data.updatedAt ?? data.installedAt ?? null,
      scopes: Array.isArray(data.scopes) ? data.scopes : [],
    })
  } catch (error) {
    console.error('[slackStatus] Error:', error)
    return Response.json(
      {
        ok: false,
        message: 'Slack 상태 조회에 실패했습니다.',
      },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const response = await fetch(`${ALERT_SERVICE_URL}/v1/slack/status`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Alert Service returned ${response.status}`)
    }

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error('[slackDisconnect] Error:', error)
    return Response.json(
      {
        ok: false,
        message: 'Slack 연동 해제에 실패했습니다.',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()

    const response = await fetch(`${ALERT_SERVICE_URL}/v1/slack/config`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Alert Service returned ${response.status}`)
    }

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error('[slackUpdateConfig] Error:', error)
    return Response.json(
      {
        ok: false,
        message: 'Slack 설정 변경에 실패했습니다.',
      },
      { status: 500 }
    )
  }
}
