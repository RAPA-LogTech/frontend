export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BASE_URL = process.env.OBSERVABILITY_SERVICE_URL ?? '';

export async function GET(request: Request) {
  if (!BASE_URL) {
    return Response.json({ events: [], nextCursor: 0, hasMore: false, latestCursor: 0 }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const upstream = `${BASE_URL}/v1/logs/backlog?${searchParams.toString()}`;

  try {
    const upstreamResponse = await fetch(upstream, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      signal: request.signal,
    });

    if (!upstreamResponse.ok) {
      return Response.json({ events: [], nextCursor: 0, hasMore: false, latestCursor: 0 }, { status: upstreamResponse.status });
    }

    const data = await upstreamResponse.json();
    return Response.json(data);
  } catch {
    return Response.json({ events: [], nextCursor: 0, hasMore: false, latestCursor: 0 }, { status: 503 });
  }
}
