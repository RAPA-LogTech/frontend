const BASE_URL = process.env.OBSERVABILITY_SERVICE_URL ?? ''

export const dynamic = 'force-dynamic'

const TIME_RANGE_MS: Record<string, number> = {
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
}

export async function GET(request: Request) {
  if (!BASE_URL) {
    return Response.json({ detail: 'OBSERVABILITY_SERVICE_URL is not configured' }, { status: 503 })
  }

  const { searchParams } = new URL(request.url)

  // timeRange → startTime/endTime 변환
  const timeRange = searchParams.get('timeRange')
  if (timeRange && TIME_RANGE_MS[timeRange]) {
    const now = Date.now()
    searchParams.delete('timeRange')
    searchParams.set('startTime', String(now - TIME_RANGE_MS[timeRange]))
    searchParams.set('endTime', String(now))
  }

  const upstream = `${BASE_URL}/v1/logs?${searchParams.toString()}`

  try {
    const res = await fetch(upstream, { signal: AbortSignal.timeout(8000) })
    const data = await res.json()
    return Response.json(data, { status: res.status })
  } catch (error) {
    return Response.json(
      { detail: error instanceof Error ? error.message : 'Failed to connect observability service' },
      { status: 503 }
    )
  }
}
