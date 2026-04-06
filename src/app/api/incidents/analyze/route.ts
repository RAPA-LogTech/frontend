export const dynamic = 'force-dynamic'

const ALERT_SERVICE_URL = process.env.ALERT_SERVICE_URL || 'http://localhost:8082'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const response = await fetch(`${ALERT_SERVICE_URL}/v1/incidents/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    if (!response.ok) return Response.json({ ok: false, message: data.detail || '분석 요청에 실패했습니다.' }, { status: response.status })
    return Response.json(data)
  } catch (error) {
    console.error('[analyzeIncident] Error:', error)
    return Response.json({ ok: false, message: '분석 요청 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
