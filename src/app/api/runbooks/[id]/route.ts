// [런북 기능] BFF 프록시 — 런북 상세 조회 / 삭제
// GET    /api/runbooks/{id}  → Lambda Function URL /v1/runbooks/{id}
// DELETE /api/runbooks/{id}  → Lambda Function URL /v1/runbooks/{id}

const RUNBOOK_URL = process.env.RUNBOOK_SERVICE_URL ?? ''

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!RUNBOOK_URL) return Response.json({ detail: 'Not configured' }, { status: 503 })
  try {
    const res = await fetch(`${RUNBOOK_URL}v1/runbooks/${id}`, {
      signal: AbortSignal.timeout(15000),
    })
    return Response.json(await res.json(), { status: res.status })
  } catch {
    return Response.json({ detail: 'Failed to fetch runbook' }, { status: 503 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!RUNBOOK_URL) return Response.json({ detail: 'Not configured' }, { status: 503 })
  try {
    const res = await fetch(`${RUNBOOK_URL}v1/runbooks/${id}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(15000),
    })
    return Response.json(await res.json(), { status: res.status })
  } catch {
    return Response.json({ detail: 'Failed to delete runbook' }, { status: 503 })
  }
}
