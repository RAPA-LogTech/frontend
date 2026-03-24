const BASE_URL = process.env.OBSERVABILITY_SERVICE_URL ?? ''

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!BASE_URL) {
    return Response.json([], { status: 200 })
  }
  try {
    const res = await fetch(`${BASE_URL}/v1/metrics/services`, {
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return Response.json([], { status: 200 })
    return Response.json(await res.json())
  } catch {
    return Response.json([], { status: 200 })
  }
}
