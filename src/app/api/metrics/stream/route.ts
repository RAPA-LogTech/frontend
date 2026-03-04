import { mockMetricSeries } from '@/lib/mock';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type StreamPoint = {
  id: string;
  ts: number;
  value: number;
};

type MutableSeriesState = {
  id: string;
  unit: string;
  value: number;
};

const encoder = new TextEncoder();

const clampByUnit = (value: number, unit: string) => {
  if (unit === '%') {
    return Math.max(0, Math.min(100, value));
  }
  return Math.max(0, value);
};

const roundByUnit = (value: number, unit: string) => {
  if (unit === '%') return Number(value.toFixed(3));
  if (unit === 'ms') return Number(value.toFixed(0));
  return Number(value.toFixed(2));
};

const nextDeltaByUnit = (unit: string) => {
  if (unit === '%') {
    return (Math.random() - 0.5) * 1.2;
  }
  if (unit === 'ms') {
    return (Math.random() - 0.5) * 24;
  }
  return (Math.random() - 0.5) * 40;
};

const buildInitialState = (): MutableSeriesState[] =>
  mockMetricSeries.map((series) => ({
    id: series.id,
    unit: series.unit,
    value: series.points[series.points.length - 1]?.value ?? 0,
  }));

export async function GET(request: Request) {
  const state = buildInitialState();
  let metricTimer: ReturnType<typeof setTimeout> | null = null;
  let heartbeatTicker: ReturnType<typeof setInterval> | null = null;

  const cleanup = () => {
    if (metricTimer) {
      clearTimeout(metricTimer);
      metricTimer = null;
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

      const emitPoints = () => {
        const ts = Date.now();
        const points: StreamPoint[] = state.map((series) => {
          const nextRaw = series.value + nextDeltaByUnit(series.unit);
          const next = roundByUnit(clampByUnit(nextRaw, series.unit), series.unit);
          series.value = next;

          return {
            id: series.id,
            ts,
            value: next,
          };
        });

        send('metric', {
          ts,
          points,
        });

        const nextDelayMs = 4500 + Math.floor(Math.random() * 5500);
        metricTimer = setTimeout(emitPoints, nextDelayMs);
      };

      emitPoints();
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
