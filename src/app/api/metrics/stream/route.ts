export const dynamic = 'force-dynamic'
export const revalidate = 0

const BASE_URL = process.env.OBSERVABILITY_SERVICE_URL ?? ''

export async function GET(request: Request) {
  if (!BASE_URL) {
    return Response.json(
      { message: 'OBSERVABILITY_SERVICE_URL is not configured' },
      { status: 503 }
    )
  }

  const { searchParams } = new URL(request.url)
  const upstream = `${BASE_URL}/v1/metrics/stream?${searchParams.toString()}`

  try {
    const upstreamResponse = await fetch(upstream, {
      headers: {
        Accept: 'text/event-stream',
      },
      cache: 'no-store',
      signal: request.signal,
    })

    if (!upstreamResponse.ok || !upstreamResponse.body) {
      return Response.json(
        { message: 'Failed to open upstream stream' },
        { status: upstreamResponse.status || 502 }
      )
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: {
        'Content-Type':
          upstreamResponse.headers.get('content-type') ?? 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch {
    return Response.json({ message: 'Failed to connect upstream stream' }, { status: 503 })
  }
}
