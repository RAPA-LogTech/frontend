const BASE_URL = process.env.OBSERVABILITY_SERVICE_URL ?? ''

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!BASE_URL) {
    return Response.json({ detail: 'OBSERVABILITY_SERVICE_URL is not configured' }, { status: 503 })
  }

  const { searchParams } = new URL(request.url)
  const upstream = `${BASE_URL}/v1/metrics/jvm?${searchParams.toString()}`

  try {
    const res = await fetch(upstream, {
      signal: AbortSignal.timeout(30000),
      headers: { 'Content-Type': 'application/json' },
    })

    if (!res.ok) {
      let errorBody: unknown = { detail: 'Upstream observability service request failed' }
      try {
        errorBody = await res.json()
      } catch {}
      return Response.json(errorBody, { status: res.status })
    }

    return Response.json(await res.json())
  } catch (error) {
    return Response.json(
      {
        detail: error instanceof Error ? error.message : 'Failed to connect observability service',
      },
      { status: 503 }
    )
  }
}
