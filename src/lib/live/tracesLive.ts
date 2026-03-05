import { mockTraces } from '@/lib/mock';
import type { Trace, TraceSpan, TraceStatus } from '@/lib/types';

export type TraceStreamPayload = {
  ts: number;
  trace: Trace;
};

const listeners = new Set<(payload: TraceStreamPayload) => void>();
const history: TraceStreamPayload[] = [];

const MAX_HISTORY = 300;
let started = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let sequence = 0;

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
  if (status === 'error') return Math.random() < 0.5 ? 500 : 503;
  if (status === 'slow') return 429;
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

const publish = (payload: TraceStreamPayload) => {
  history.push(payload);
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
  listeners.forEach((listener) => listener(payload));
};

const emit = () => {
  sequence += 1;
  publish({
    ts: Date.now(),
    trace: makeLiveTrace(mockTraces, sequence),
  });

  const nextDelayMs = 3500 + Math.floor(Math.random() * 7500);
  timer = setTimeout(emit, nextDelayMs);
};

export const ensureTracesProducer = () => {
  if (started) return;
  started = true;
  emit();
};

export const subscribeTraces = (listener: (payload: TraceStreamPayload) => void) => {
  ensureTracesProducer();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getTraceBacklog = (since: number) => {
  ensureTracesProducer();
  return history.filter((event) => event.ts > since);
};

export const getLatestTraceTs = () => {
  const last = history[history.length - 1];
  return last?.ts ?? 0;
};
