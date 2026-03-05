import { getLatestMetricTs, subscribeMetrics } from '@/lib/live/metricsLive';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const encoder = new TextEncoder();

export async function GET(request: Request) {
  let heartbeatTicker: ReturnType<typeof setInterval> | null = null;
  let unsubscribe: (() => void) | null = null;

  const cleanup = () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    if (heartbeatTicker) {
      clearInterval(heartbeatTicker);
      heartbeatTicker = null;
    }
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, payload: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      controller.enqueue(encoder.encode('retry: 2000\n\n'));

      unsubscribe = subscribeMetrics((payload) => {
        send('metric', payload);
      });

      controller.enqueue(encoder.encode(`: latest-ts ${getLatestMetricTs()}\n\n`));
      heartbeatTicker = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping ${Date.now()}\n\n`));
      }, 15000);

      request.signal.addEventListener('abort', cleanup, { once: true });
      controller.enqueue(encoder.encode(': stream-open\n\n'));
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
