import type { LogEntry, LogLevel } from '@/lib/types';
import { mockLogs } from '@/lib/mock';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type LogStreamPayload = {
  ts: number;
  log: LogEntry;
};

const encoder = new TextEncoder();

const pickRandom = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const randomLevel = (): LogLevel => {
  const roll = Math.random();
  if (roll < 0.1) return 'ERROR';
  if (roll < 0.28) return 'WARN';
  if (roll < 0.45) return 'DEBUG';
  return 'INFO';
};

const jitterLatency = (base: number) => {
  const next = base * (1 + (Math.random() - 0.5) * 0.45);
  return Math.max(1, Math.round(next));
};

const makeLiveLog = (templates: LogEntry[], seq: number): LogEntry => {
  const base = pickRandom(templates);
  const level = randomLevel();
  const now = new Date();
  const id = `log-live-${now.getTime()}-${seq}`;

  const metadata: NonNullable<LogEntry['metadata']> = { ...(base.metadata ?? {}) };
  const tags = { ...(base.tags ?? {}) };

  metadata.requestId = `req-${Math.random().toString(16).slice(2, 14)}`;
  metadata.traceId = `trace-live-${Math.floor(1000 + Math.random() * 9000)}`;
  metadata.spanId = `span-${Math.floor(100 + Math.random() * 900)}-${Math.floor(10 + Math.random() * 90)}`;

  const latencyCandidate = Number(metadata.latency_ms ?? metadata.duration_ms ?? metadata.timeout_ms ?? 120);
  if (Number.isFinite(latencyCandidate)) {
    metadata.latency_ms = jitterLatency(latencyCandidate);
  }

  return {
    ...base,
    id,
    timestamp: now.toISOString(),
    level,
    metadata,
    tags,
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

      const emitLog = () => {
        sequence += 1;

        const payload: LogStreamPayload = {
          ts: Date.now(),
          log: makeLiveLog(mockLogs, sequence),
        };

        send('log', payload);

        const nextDelayMs = 2200 + Math.floor(Math.random() * 6800);
        timer = setTimeout(emitLog, nextDelayMs);
      };

      emitLog();

      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping ${Date.now()}\n\n`));
      }, 15000);

      request.signal.addEventListener('abort', cleanup, { once: true });
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
