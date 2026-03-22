import { cookies } from 'next/headers'
import { getSlackOAuthConfig, isSlackOAuthConfigured } from '@/lib/slackIntegrationStore'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const oauthStateCookieName = 'slack_oauth_state'

const getAppOrigin = (request: Request) => {
  const configuredRedirectUri = process.env.SLACK_REDIRECT_URI?.trim()

  if (configuredRedirectUri) {
    return new URL(configuredRedirectUri).origin
  }

  return new URL(request.url).origin
}

const getRedirectUri = (request: Request) => {
  const configured = process.env.SLACK_REDIRECT_URI?.trim()

  if (configured) {
    return configured
  }

  const url = new URL(request.url)
  return `${url.origin}/api/integrations/slack/callback`
}

export async function GET(request: Request) {
  if (!isSlackOAuthConfigured()) {
    return Response.redirect(
      new URL('/integrations/slack?slack=not-configured', getAppOrigin(request))
    )
  }

  const state = crypto.randomUUID()
  const cookieStore = await cookies()
  cookieStore.set(oauthStateCookieName, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10,
    path: '/',
  })

  const config = getSlackOAuthConfig()
  const authorizeUrl = new URL('https://slack.com/oauth/v2/authorize')
  authorizeUrl.searchParams.set('client_id', config.clientId)
  authorizeUrl.searchParams.set('scope', config.scopes.join(','))
  authorizeUrl.searchParams.set('state', state)
  authorizeUrl.searchParams.set('redirect_uri', getRedirectUri(request))

  return Response.redirect(authorizeUrl)
}
