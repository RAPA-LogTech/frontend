import { SlackIntegrationStatus } from './types'

export type SlackOAuthConfig = {
  clientId: string
  clientSecret: string
  signingSecret: string
  scopes: string[]
}

export type SlackInstallation = {
  teamId?: string
  teamName?: string
  channelId?: string
  channelName?: string
  webhookUrl?: string
  botAccessToken?: string
  webhookUrlMasked?: string
  installedBy?: string
  installedAt?: string
  updatedAt: string
  scopes: string[]
}

let installation: SlackInstallation = {
  updatedAt: new Date().toISOString(),
  scopes: getSlackOAuthConfig().scopes,
}

export function getSlackOAuthConfig(): SlackOAuthConfig {
  const scopeValue = process.env.SLACK_BOT_SCOPES?.trim()

  return {
    clientId: process.env.SLACK_CLIENT_ID?.trim() ?? '',
    clientSecret: process.env.SLACK_CLIENT_SECRET?.trim() ?? '',
    signingSecret: process.env.SLACK_SIGNING_SECRET?.trim() ?? '',
    scopes: scopeValue
      ? scopeValue
          .split(',')
          .map(scope => scope.trim())
          .filter(Boolean)
      : ['incoming-webhook', 'chat:write'],
  }
}

export function isSlackOAuthConfigured() {
  const config = getSlackOAuthConfig()
  return Boolean(config.clientId && config.clientSecret)
}

export function getSlackInstallation() {
  installation = {
    ...installation,
    scopes: installation.scopes.length ? installation.scopes : getSlackOAuthConfig().scopes,
  }

  return installation
}

export function setSlackInstallation(nextInstallation: Omit<SlackInstallation, 'updatedAt'>) {
  installation = {
    ...nextInstallation,
    updatedAt: new Date().toISOString(),
  }

  return installation
}

export function hydrateSlackInstallation(nextInstallation: SlackInstallation) {
  installation = {
    ...nextInstallation,
    scopes: nextInstallation.scopes.length ? nextInstallation.scopes : getSlackOAuthConfig().scopes,
  }

  return installation
}

export function clearSlackInstallation() {
  installation = {
    updatedAt: new Date().toISOString(),
    scopes: getSlackOAuthConfig().scopes,
  }

  return installation
}

export function getMaskedWebhookUrl(webhookUrl?: string): string {
  if (!webhookUrl) {
    return ''
  }

  const head = webhookUrl.slice(0, 32)
  const tail = webhookUrl.slice(-8)

  return `${head}...${tail}`
}

export function getSlackIntegrationStatus(): SlackIntegrationStatus {
  const current = getSlackInstallation()

  return {
    oauthConfigured: isSlackOAuthConfigured(),
    connected: Boolean(current.botAccessToken || current.webhookUrl),
    teamId: current.teamId,
    teamName: current.teamName,
    channelId: current.channelId,
    channelName: current.channelName,
    webhookUrlMasked: current.webhookUrlMasked,
    installedBy: current.installedBy,
    installedAt: current.installedAt,
    updatedAt: current.updatedAt,
    scopes: current.scopes,
  }
}
