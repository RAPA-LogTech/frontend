import { cookies } from 'next/headers'
import {
  getMaskedWebhookUrl,
  getSlackOAuthConfig,
  setSlackInstallation,
} from '@/lib/slackIntegrationStore'
import { writePersistedSlackInstallation } from '@/lib/slackInstallationPersistence'

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

type SlackOAuthResponse = {
  ok?: boolean
  error?: string
  access_token?: string
  scope?: string
  team?: {
    id?: string
    name?: string
  }
  authed_user?: {
    id?: string
  }
  incoming_webhook?: {
    channel?: string
    channel_id?: string
    url?: string
  }
}

const getRedirectUri = (request: Request) => {
  const configured = process.env.SLACK_REDIRECT_URI?.trim()

  if (configured) {
    return configured
  }

  const url = new URL(request.url)
  return `${url.origin}/api/integrations/slack/callback`
}

const redirectToIntegrationPage = (request: Request, status: string, details?: string) => {
  const url = new URL('/integrations/slack', getAppOrigin(request))
  url.searchParams.set('slack', status)

  if (details) {
    url.searchParams.set('details', details)
  }

  return Response.redirect(url)
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const state = url.searchParams.get('state') ?? ''
  const code = url.searchParams.get('code') ?? ''
  const authError = url.searchParams.get('error') ?? ''
  const cookieStore = await cookies()
  const savedState = cookieStore.get(oauthStateCookieName)?.value ?? ''
  cookieStore.delete(oauthStateCookieName)

  if (authError) {
    return redirectToIntegrationPage(request, 'cancelled', authError)
  }

  if (!state || !savedState || state !== savedState) {
    return redirectToIntegrationPage(request, 'state-error')
  }

  if (!code) {
    return redirectToIntegrationPage(request, 'missing-code')
  }

  const config = getSlackOAuthConfig()
  const response = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: getRedirectUri(request),
    }),
  })

  const data = (await response.json()) as SlackOAuthResponse

  if (!response.ok || !data.ok) {
    return redirectToIntegrationPage(request, 'oauth-error', data.error ?? response.statusText)
  }

  const webhookUrl = data.incoming_webhook?.url
  const scopeList =
    data.scope
      ?.split(',')
      .map(scope => scope.trim())
      .filter(Boolean) ?? config.scopes

  const installation = setSlackInstallation({
    teamId: data.team?.id,
    teamName: data.team?.name,
    channelId: data.incoming_webhook?.channel_id,
    channelName: data.incoming_webhook?.channel,
    webhookUrl,
    botAccessToken: data.access_token,
    webhookUrlMasked: getMaskedWebhookUrl(webhookUrl),
    installedBy: data.authed_user?.id,
    installedAt: new Date().toISOString(),
    scopes: scopeList,
  })

  await writePersistedSlackInstallation(installation)

  return redirectToIntegrationPage(request, 'connected')
}
