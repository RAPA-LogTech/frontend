// BFF 프록시: GET /api/observability/metrics/service-health
// dashboard → observability-service /v1/metrics/service-health

const BASE_URL = process.env.OBSERVABILITY_SERVICE_URL ?? ''

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!BASE_URL) {
    return Response.json({ detail: 'OBSERVABILITY_SERVICE_URL is not configured' }, { status: 503 })
  }

  const upstream = `${BASE_URL}/v1/metrics/service-health`

  try {
    const res = await fetch(upstream, {
      signal: AbortSignal.timeout(30000),
      headers: { 'Content-Type': 'application/json' },
    })

    if (!res.ok) {
      let errorBody: unknown = { detail: 'Upstream observability service request failed' }
      try {
        errorBody = await res.json()
      } catch {
        // Keep default message when upstream body is not JSON.
      }
      return Response.json(errorBody, { status: res.status })
    }

    const data = await res.json()
    return Response.json(data)
  } catch (error) {
    return Response.json(
      {
        detail: error instanceof Error ? error.message : 'Failed to connect observability service',
      },
      { status: 503 }
    )
  }
}
