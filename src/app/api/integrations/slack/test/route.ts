import { getSlackInstallation, hydrateSlackInstallation } from '@/lib/slackIntegrationStore'
import { readPersistedSlackInstallation } from '@/lib/slackInstallationPersistence'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type SlackTestPayload = {
  text?: string
}

export async function POST(request: Request) {
  let payload: SlackTestPayload

  try {
    payload = (await request.json()) as SlackTestPayload
  } catch {
    return Response.json(
      {
        ok: false,
        error: 'INVALID_JSON',
        message: '요청 본문이 올바른 JSON 형식이 아닙니다.',
      },
      { status: 400 }
    )
  }

  const persisted = await readPersistedSlackInstallation()

  if (persisted) {
    hydrateSlackInstallation(persisted)
  }

  const installation = getSlackInstallation()
  const webhookUrl = installation.webhookUrl
  const channelId = installation.channelId
  const channelName = installation.channelName
  const botAccessToken = installation.botAccessToken

  if (!webhookUrl && !botAccessToken) {
    return Response.json(
      {
        ok: false,
        error: 'NOT_CONNECTED',
        message: 'Slack 워크스페이스가 연결되어 있지 않습니다.',
      },
      { status: 400 }
    )
  }

  const text = payload.text?.trim() || '[TEST] Observability alert pipeline health check'

  if (webhookUrl) {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
      }),
    })

    if (!response.ok) {
      const body = await response.text()

      return Response.json(
        {
          ok: false,
          error: 'SLACK_REQUEST_FAILED',
          message: `Slack 요청 실패 (${response.status}): ${body || response.statusText}`,
        },
        { status: 502 }
      )
    }

    return Response.json({
      ok: true,
      channel: channelName ?? channelId,
      sentAt: new Date().toISOString(),
    })
  }

  if (botAccessToken && channelId) {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${botAccessToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        channel: channelId,
        text,
      }),
    })

    const data = (await response.json()) as { ok?: boolean; error?: string }

    if (!response.ok || !data.ok) {
      return Response.json(
        {
          ok: false,
          error: 'SLACK_REQUEST_FAILED',
          message: `Slack 요청 실패: ${data.error ?? response.statusText}`,
        },
        { status: 502 }
      )
    }

    return Response.json({
      ok: true,
      channel: channelName ?? channelId,
      sentAt: new Date().toISOString(),
    })
  }

  return Response.json(
    {
      ok: false,
      error: 'MISSING_DESTINATION',
      message: 'Slack 전송 대상(webhook 또는 channel)을 찾을 수 없습니다.',
    },
    { status: 400 }
  )
}
