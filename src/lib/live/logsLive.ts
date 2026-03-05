import { mockLogs } from '@/lib/mock';
import type { LogEntry, LogLevel } from '@/lib/types';

export type LogStreamPayload = {
  ts: number;
  log: LogEntry;
};

const listeners = new Set<(payload: LogStreamPayload) => void>();
const history: LogStreamPayload[] = [];

const MAX_HISTORY = 1000;
let started = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let sequence = 0;

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

const publish = (payload: LogStreamPayload) => {
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
    log: makeLiveLog(mockLogs, sequence),
  });

  const nextDelayMs = 2200 + Math.floor(Math.random() * 6800);
  timer = setTimeout(emit, nextDelayMs);
};

export const ensureLogsProducer = () => {
  if (started) return;
  started = true;
  emit();
};

export const subscribeLogs = (listener: (payload: LogStreamPayload) => void) => {
  ensureLogsProducer();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getLogBacklog = (since: number) => {
  ensureLogsProducer();
  return history.filter((event) => event.ts > since);
};

export const getLatestLogTs = () => {
  const last = history[history.length - 1];
  return last?.ts ?? 0;
};
