export const dynamic = 'force-dynamic'
export const revalidate = 0

const ALERT_SERVICE_URL = process.env.ALERT_SERVICE_URL || 'http://localhost:8082'

type IncidentStatus = 'ongoing' | 'analyzed' | 'resolved'

const STATUS_ORDER: IncidentStatus[] = ['ongoing', 'analyzed', 'resolved']

type IncidentSummary = {
  incident_id: string
  alert_name?: string | null
  severity?: string | null
  status?: string | null
  service_info?: string | null
  created_at?: string | null
  last_notified_at?: string | null
  resolved_at?: string | null
  slack_url?: string | null
  slack_ts?: string | null
  s3_key?: string | null
}

type IncidentListResponse = {
  items: IncidentSummary[]
  next_cursor?: string | null
}

const fetchByStatus = async (
  status: IncidentStatus,
  limit: number
): Promise<IncidentListResponse> => {
  const params = new URLSearchParams({
    status,
    limit: String(limit),
  })

  const response = await fetch(`${ALERT_SERVICE_URL}/v1/incidents?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Alert Service returned ${response.status} for status=${status}`)
  }

  return (await response.json()) as IncidentListResponse
}

const parseLimit = (raw: string | null) => {
  const limit = Number(raw)
  if (!Number.isFinite(limit)) return 50
  return Math.max(1, Math.min(200, Math.trunc(limit)))
}

const sortByCreatedAtDesc = (a: IncidentSummary, b: IncidentSummary) => {
  const ta = a.created_at ? Date.parse(a.created_at) : 0
  const tb = b.created_at ? Date.parse(b.created_at) : 0
  return tb - ta
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || 'all'
    const limit = parseLimit(url.searchParams.get('limit'))

    if (status === 'all') {
      const results = await Promise.all(STATUS_ORDER.map(item => fetchByStatus(item, limit)))
      const merged = results
        .flatMap(result => result.items)
        .sort(sortByCreatedAtDesc)
        .slice(0, limit)

      return Response.json({
        items: merged,
        next_cursor: null,
      })
    }

    if (!STATUS_ORDER.includes(status as IncidentStatus)) {
      return Response.json(
        {
          ok: false,
          message: 'status 값은 all|ongoing|analyzed|resolved 중 하나여야 합니다.',
        },
        { status: 400 }
      )
    }

    const cursor = url.searchParams.get('cursor')
    const params = new URLSearchParams({
      status,
      limit: String(limit),
    })

    if (cursor) {
      params.set('cursor', cursor)
    }

    const response = await fetch(`${ALERT_SERVICE_URL}/v1/incidents?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const responseBody = await response.json().catch(() => ({}))

    if (!response.ok) {
      const detail =
        responseBody && typeof responseBody === 'object' && 'detail' in responseBody
          ? String((responseBody as { detail?: string }).detail || '')
          : ''
      return Response.json(
        {
          ok: false,
          message: detail || 'Slack 인시던트 목록 조회에 실패했습니다.',
        },
        { status: response.status }
      )
    }

    return Response.json(responseBody)
  } catch (error) {
    console.error('[incidentsList] Error:', error)
    return Response.json(
      {
        ok: false,
        message: 'Slack 인시던트 목록 조회 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}
