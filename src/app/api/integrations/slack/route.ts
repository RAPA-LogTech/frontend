import {
  clearSlackInstallation,
  hydrateSlackInstallation,
  getSlackIntegrationStatus,
} from '@/lib/slackIntegrationStore'
import {
  clearPersistedSlackInstallation,
  readPersistedSlackInstallation,
} from '@/lib/slackInstallationPersistence'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const persisted = await readPersistedSlackInstallation()

  if (persisted) {
    hydrateSlackInstallation(persisted)
  }

  return Response.json(getSlackIntegrationStatus())
}

export async function DELETE() {
  clearSlackInstallation()
  await clearPersistedSlackInstallation()

  return Response.json({
    ok: true,
    disconnectedAt: new Date().toISOString(),
  })
}
