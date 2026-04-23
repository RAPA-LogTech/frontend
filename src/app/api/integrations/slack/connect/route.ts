export const dynamic = 'force-dynamic'
export const revalidate = 0

const ALERT_SERVICE_URL = process.env.ALERT_SERVICE_URL || 'http://localhost:8082'

function getPublicOrigin(request: Request): string {
  const configured = process.env.PUBLIC_DASHBOARD_URL?.trim()
  if (configured) {
    return configured.replace(/\/$/, '')
  }

  const proto = request.headers.get('x-forwarded-proto')
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  if (proto && host) {
    return `${proto}://${host}`
  }

  return new URL(request.url).origin
}

function redirectToNotifications(request: Request, status: string, details?: string) {
  const redirectUrl = new URL('/notifications', getPublicOrigin(request))
  redirectUrl.searchParams.set('slack', status)
  if (details) {
    redirectUrl.searchParams.set('details', details)
  }
  return Response.redirect(redirectUrl.toString())
}

export async function GET(request: Request) {
  try {
    // 리다이렉트 URI 설정
    const baseUrl = getPublicOrigin(request)
    const redirectUri = `${baseUrl}/api/integrations/slack/callback`

    // alert-service의 OAuth connect 엔드포인트로 리다이렉트
    const connectUrl = new URL(`${ALERT_SERVICE_URL}/v1/slack/oauth/connect`)
    connectUrl.searchParams.set('redirect_uri', redirectUri)

    const connectResponse = await fetch(connectUrl.toString(), {
      method: 'GET',
      redirect: 'manual',
    })

    const locationHeader = connectResponse.headers.get('location')
    if (connectResponse.status >= 300 && connectResponse.status < 400 && locationHeader) {
      const destination = new URL(locationHeader, ALERT_SERVICE_URL).toString()
      return Response.redirect(destination)
    }

    const connectErrorBody = await connectResponse.json().catch(() => ({}))
    const connectDetail =
      (connectErrorBody as Record<string, unknown>).detail ||
      (connectErrorBody as Record<string, unknown>).message
    const connectMessage =
      typeof connectDetail === 'string' && connectDetail.length > 0
        ? connectDetail
        : 'Slack OAuth 연결을 시작하지 못했습니다.'
    return redirectToNotifications(request, 'connect-error', connectMessage)
  } catch (error) {
    console.error('[slackConnect] Error:', error)
    const message =
      error instanceof Error ? error.message : 'Slack 연동 시작 중 예외가 발생했습니다.'
    return redirectToNotifications(request, 'connect-error', message)
  }
}
