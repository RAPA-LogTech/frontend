import { promises as fs } from 'fs'
import { SlackInstallation } from './slackIntegrationStore'

const installStorePath =
  process.env.SLACK_INSTALLATION_STORE_PATH?.trim() || '/tmp/logtech-slack-installation.json'

export async function readPersistedSlackInstallation(): Promise<SlackInstallation | null> {
  try {
    const raw = await fs.readFile(installStorePath, 'utf-8')
    const parsed = JSON.parse(raw) as SlackInstallation

    if (!parsed || typeof parsed !== 'object') {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export async function writePersistedSlackInstallation(installation: SlackInstallation) {
  await fs.writeFile(installStorePath, JSON.stringify(installation), 'utf-8')
}

export async function clearPersistedSlackInstallation() {
  try {
    await fs.unlink(installStorePath)
  } catch {
    // no-op
  }
}
