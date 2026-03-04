import type { Trace, TraceSpan, TraceStatus } from '@/lib/types';
import { mockTraces } from '@/lib/mock';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type TraceStreamPayload = {
  ts: number;
  trace: Trace;
};

const encoder = new TextEncoder();

const pickRandom = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const jitter = (value: number, ratio: number, minValue: number) => {
  const next = value * (1 + (Math.random() * 2 - 1) * ratio);
  return Math.max(minValue, next);
};

const randomStatus = (): TraceStatus => {
  const roll = Math.random();
  if (roll < 0.14) return 'error';
  if (roll < 0.34) return 'slow';
  return 'ok';
};

const statusCodeByStatus = (status: TraceStatus) => {
  if (status === 'error') {
    return Math.random() < 0.5 ? 500 : 503;
  }
  if (status === 'slow') {
    return 429;
  }
  return 200;
};

const makeLiveTrace = (templates: Trace[], seq: number): Trace => {
  const template = pickRandom(templates);
  const now = Date.now();
  const status = randomStatus();
  const statusCode = statusCodeByStatus(status);
  const baseDuration = template.duration;
  const durationMultiplier = status === 'error' ? 1.7 : status === 'slow' ? 1.25 : 0.92;
  const traceDuration = Math.max(20, Math.round(jitter(baseDuration * durationMultiplier, 0.22, 20)));
  const traceId = `trace-live-${now}-${seq}`;
  const traceStart = now - traceDuration - Math.floor(Math.random() * 900);

  const sortedTemplateSpans = [...template.spans].sort((a, b) => a.startTime - b.startTime);
  const templateStart = sortedTemplateSpans[0]?.startTime ?? traceStart;
  const spanIdMap = new Map<string, string>();

  const spans: TraceSpan[] = sortedTemplateSpans.map((span, index) => {
    const mappedId = `${traceId}-span-${index + 1}`;
    spanIdMap.set(span.id, mappedId);

    const relativeOffset = Math.max(0, span.startTime - templateStart);
    const scaledOffset = Math.round(relativeOffset * (traceDuration / Math.max(1, template.duration)));
    const spanStatus: TraceStatus = status === 'error' && Math.random() < 0.22
      ? 'error'
      : status === 'slow' && Math.random() < 0.28
        ? 'slow'
        : span.status;
    const durationBoost = spanStatus === 'error' ? 1.45 : spanStatus === 'slow' ? 1.25 : 0.95;
    const spanDuration = Math.max(2, Math.round(jitter(span.duration * durationBoost, 0.26, 2)));

    return {
      ...span,
      id: mappedId,
      traceId,
      parentSpanId: span.parentSpanId ? spanIdMap.get(span.parentSpanId) : undefined,
      startTime: traceStart + scaledOffset,
      duration: spanDuration,
      status: spanStatus,
    };
  });

  const rootService = spans[0]?.service ?? template.service;
  const rootOperation = template.operation;

  return {
    ...template,
    id: traceId,
    service: rootService,
    operation: rootOperation,
    startTime: traceStart,
    duration: traceDuration,
    status,
    status_code: statusCode,
    spans,
  };
};

export async function GET(request: Request) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let sequence = 0;

  const cleanup = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
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

      const emitTrace = () => {
        sequence += 1;
        const payload: TraceStreamPayload = {
          ts: Date.now(),
          trace: makeLiveTrace(mockTraces, sequence),
        };
        send('trace', payload);

        const nextDelayMs = 3500 + Math.floor(Math.random() * 7500);
        timer = setTimeout(emitTrace, nextDelayMs);
      };

      emitTrace();

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
