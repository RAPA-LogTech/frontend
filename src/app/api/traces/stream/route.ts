import { getLatestTraceTs, subscribeTraces } from '@/lib/live/tracesLive';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const encoder = new TextEncoder();

export async function GET(request: Request) {
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const cleanup = () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = null;
    }
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, payload: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      controller.enqueue(encoder.encode('retry: 2000\n\n'));

      unsubscribe = subscribeTraces((payload) => {
        send('trace', payload);
      });

      controller.enqueue(encoder.encode(`: latest-ts ${getLatestTraceTs()}\n\n`));

      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping ${Date.now()}\n\n`));
      }, 15000);

      request.signal.addEventListener(
        'abort',
        () => {
          cleanup();
        },
        { once: true },
      );
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
