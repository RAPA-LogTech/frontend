export const dynamic = 'force-dynamic'
export const revalidate = 0

const ALERT_SERVICE_URL = process.env.ALERT_SERVICE_URL || 'http://localhost:8082'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ incidentId: string }> }
) {
  try {
    const { incidentId } = await params

    if (!incidentId) {
      return Response.json(
        {
          ok: false,
          message: 'incidentId가 필요합니다.',
        },
        { status: 400 }
      )
    }

    const response = await fetch(
      `${ALERT_SERVICE_URL}/v1/incidents/${encodeURIComponent(incidentId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    const responseBody = await response.json().catch(() => ({}))

    if (!response.ok) {
      const detail =
        responseBody && typeof responseBody === 'object' && 'detail' in responseBody
          ? String((responseBody as { detail?: string }).detail || '')
          : ''
      return Response.json(
        {
          ok: false,
          message: detail || 'Slack 인시던트 상세 조회에 실패했습니다.',
        },
        { status: response.status }
      )
    }

    return Response.json(responseBody)
  } catch (error) {
    console.error('[incidentDetail] Error:', error)
    return Response.json(
      {
        ok: false,
        message: 'Slack 인시던트 상세 조회 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}
