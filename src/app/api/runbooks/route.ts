// [런북 기능] BFF 프록시 — 런북 목록 조회 + 업로드
// GET  /api/runbooks  → Lambda Function URL /v1/runbooks/
// POST /api/runbooks  → Lambda Function URL /v1/runbooks/ (multipart file upload)

const RUNBOOK_URL = process.env.RUNBOOK_SERVICE_URL ?? ''

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!RUNBOOK_URL) return Response.json({ runbooks: [], total: 0 })
  try {
    const res = await fetch(`${RUNBOOK_URL}v1/runbooks/`, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) return Response.json({ runbooks: [], total: 0 }, { status: res.status })
    return Response.json(await res.json())
  } catch {
    return Response.json({ runbooks: [], total: 0 }, { status: 503 })
  }
}

export async function POST(request: Request) {
  if (!RUNBOOK_URL) return Response.json({ detail: 'RUNBOOK_SERVICE_URL not configured' }, { status: 503 })
  try {
    const formData = await request.formData()
    const res = await fetch(`${RUNBOOK_URL}v1/runbooks/`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(30000),
    })
    return Response.json(await res.json(), { status: res.status })
  } catch {
    return Response.json({ detail: 'Upload failed' }, { status: 503 })
  }
}
