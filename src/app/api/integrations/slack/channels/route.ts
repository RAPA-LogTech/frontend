export const dynamic = 'force-dynamic'
export const revalidate = 0

const ALERT_SERVICE_URL = process.env.ALERT_SERVICE_URL || 'http://localhost:8082'

export type SlackChannelListItem = {
  id: string
  name: string
  isPrivate: boolean
  isMember: boolean
}

export type SlackChannelListResponse = {
  ok: boolean
  channels: SlackChannelListItem[]
  error?: string
}

export async function GET(): Promise<Response> {
  try {
    const response = await fetch(`${ALERT_SERVICE_URL}/v1/slack/channels`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      const errorObj = data as Record<string, unknown>
      const errorMsg: string =
        typeof errorObj.detail === 'string'
          ? errorObj.detail
          : typeof errorObj.message === 'string'
            ? errorObj.message
            : 'Slack 채널 조회 실패'
      return Response.json(
        {
          ok: false,
          channels: [],
          error: errorMsg,
        } as SlackChannelListResponse,
        { status: response.status }
      )
    }

    return Response.json(data as SlackChannelListResponse)
  } catch (error) {
    console.error('[slackChannels] Error:', error)
    return Response.json(
      {
        ok: false,
        channels: [],
        error: 'Slack 채널 조회에 실패했습니다.',
      } as SlackChannelListResponse,
      { status: 500 }
    )
  }
}
