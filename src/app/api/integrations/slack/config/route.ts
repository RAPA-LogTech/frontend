export const dynamic = 'force-dynamic'
export const revalidate = 0

const ALERT_SERVICE_URL = process.env.ALERT_SERVICE_URL || 'http://localhost:8082'

export async function GET() {
  try {
    // alert-service에서 OAuth 시작 가능 여부 확인
    const response = await fetch(`${ALERT_SERVICE_URL}/v1/slack/oauth/ready`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Alert Service returned ${response.status}`)
    }

    const data = await response.json()
    const ready = Boolean((data as Record<string, unknown>).ready)
    const msg =
      typeof (data as Record<string, unknown>).message === 'string'
        ? (data as Record<string, unknown>).message
        : ''
    return Response.json({
      configured: ready,
      ...(ready ? {} : { message: msg || 'Slack OAuth 설정이 필요합니다.' }),
    })
  } catch (error) {
    console.error('[slackConfig] Error:', error)
    return Response.json(
      {
        configured: false,
        message: 'Slack OAuth 설정 확인에 실패했습니다.',
      },
      { status: 500 }
    )
  }
}
