// BFF 프록시: GET /api/observability/traces
// dashboard → observability-service /v1/traces

const BASE_URL = process.env.OBSERVABILITY_SERVICE_URL ?? '';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!BASE_URL) {
    return Response.json({ traces: [], total: 0 }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const upstream = `${BASE_URL}/v1/traces?${searchParams.toString()}`;

  try {
    const res = await fetch(upstream, {
      signal: AbortSignal.timeout(8000),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) return Response.json({ traces: [], total: 0 }, { status: res.status });

    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json({ traces: [], total: 0 }, { status: 503 });
  }
}
