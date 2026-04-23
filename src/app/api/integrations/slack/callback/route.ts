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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const origin = getPublicOrigin(request)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    if (error) {
      return Response.redirect(
        new URL(`/notifications?slack=cancelled&error=${error}`, origin).toString()
      )
    }

    if (!code) {
      return Response.redirect(new URL('/notifications?slack=missing-code', origin).toString())
    }

    if (!state) {
      console.warn('[slackCallback] Missing OAuth state; proceeding for backward compatibility')
    }

    // alert-service의 OAuth callback 엔드포인트 호출
    const callbackUrl = new URL(`${ALERT_SERVICE_URL}/v1/slack/oauth/callback`)
    callbackUrl.searchParams.set('code', code)
    if (state) {
      callbackUrl.searchParams.set('state', state)
    }

    const response = await fetch(callbackUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorObj = errorData as Record<string, unknown>
      const errorMsg: string =
        typeof errorObj.detail === 'string' ? errorObj.detail : 'Unknown error'
      return Response.redirect(
        new URL(
          `/notifications?slack=oauth-error&details=${encodeURIComponent(errorMsg)}`,
          origin
        ).toString()
      )
    }

    // 성공적으로 연동됨
    return Response.redirect(new URL('/notifications?slack=connected', origin).toString())
  } catch (error) {
    console.error('[slackCallback] Error:', error)
    return Response.json(
      {
        ok: false,
        message: 'Slack OAuth 콜백 처리에 실패했습니다.',
      },
      { status: 500 }
    )
  }
}
