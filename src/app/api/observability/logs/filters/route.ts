const BASE_URL = process.env.OBSERVABILITY_SERVICE_URL ?? ''

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!BASE_URL) {
    return Response.json({ detail: 'OBSERVABILITY_SERVICE_URL is not configured' }, { status: 503 })
  }

  try {
    const res = await fetch(`${BASE_URL}/v1/logs/filters`, {
      signal: AbortSignal.timeout(8000),
    })
    const data = await res.json()
    return Response.json(data, { status: res.status })
  } catch (error) {
    return Response.json(
      { detail: error instanceof Error ? error.message : 'Failed to connect observability service' },
      { status: 503 }
    )
  }
}
