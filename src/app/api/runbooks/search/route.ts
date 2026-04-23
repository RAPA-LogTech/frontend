// [런북 기능] BFF 프록시 — Bedrock KB 런북 검색
// GET /api/runbooks/search?q=...  → Lambda Function URL /v1/runbooks/search?q=...

const RUNBOOK_URL = process.env.RUNBOOK_SERVICE_URL ?? ''

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!RUNBOOK_URL) return Response.json({ results: [] }, { status: 503 })
  const { searchParams } = new URL(request.url)
  try {
    const res = await fetch(`${RUNBOOK_URL}v1/runbooks/search?${searchParams.toString()}`, {
      signal: AbortSignal.timeout(15000),
    })
    return Response.json(await res.json(), { status: res.status })
  } catch {
    return Response.json({ results: [] }, { status: 503 })
  }
}
