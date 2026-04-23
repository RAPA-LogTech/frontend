const BASE_URL = process.env.OBSERVABILITY_SERVICE_URL ?? ''

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ traceId: string }> }) {
  if (!BASE_URL) {
    return Response.json({ detail: 'OBSERVABILITY_SERVICE_URL is not configured' }, { status: 503 })
  }

  const { traceId } = await params
  const upstream = `${BASE_URL}/v1/traces/trace/${encodeURIComponent(traceId)}`

  try {
    const res = await fetch(upstream, {
      signal: AbortSignal.timeout(30000),
      headers: { 'Content-Type': 'application/json' },
    })

    if (!res.ok) {
      let errorBody: unknown = { detail: 'Upstream request failed' }
      try {
        errorBody = await res.json()
      } catch {
        // keep default
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
