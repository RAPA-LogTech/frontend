import { getLatestLogTs, getLogBacklog } from '@/lib/live/logsLive';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sinceParam = Number(searchParams.get('since') ?? '0');
  const since = Number.isFinite(sinceParam) ? sinceParam : 0;

  const events = getLogBacklog(since);

  return Response.json({
    events,
    latestTs: getLatestLogTs(),
  });
}
