import { mockMetricSeries } from '@/lib/mock';

type StreamPoint = {
  id: string;
  ts: number;
  value: number;
};

export type MetricStreamPayload = {
  ts: number;
  points: StreamPoint[];
};

type MutableSeriesState = {
  id: string;
  unit: string;
  value: number;
};

const listeners = new Set<(payload: MetricStreamPayload) => void>();
const history: MetricStreamPayload[] = [];

const MAX_HISTORY = 400;
let started = false;
let timer: ReturnType<typeof setTimeout> | null = null;

const clampByUnit = (value: number, unit: string) => {
  if (unit === '%') return Math.max(0, Math.min(100, value));
  return Math.max(0, value);
};

const roundByUnit = (value: number, unit: string) => {
  if (unit === '%') return Number(value.toFixed(3));
  if (unit === 'ms') return Number(value.toFixed(0));
  return Number(value.toFixed(2));
};

const nextDeltaByUnit = (unit: string) => {
  if (unit === '%') return (Math.random() - 0.5) * 1.2;
  if (unit === 'ms') return (Math.random() - 0.5) * 24;
  return (Math.random() - 0.5) * 40;
};

const buildInitialState = (): MutableSeriesState[] =>
  mockMetricSeries.map((series) => ({
    id: series.id,
    unit: series.unit,
    value: series.points[series.points.length - 1]?.value ?? 0,
  }));

const state = buildInitialState();

const publish = (payload: MetricStreamPayload) => {
  history.push(payload);
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
  listeners.forEach((listener) => listener(payload));
};

const emit = () => {
  const ts = Date.now();
  const points: StreamPoint[] = state.map((series) => {
    const nextRaw = series.value + nextDeltaByUnit(series.unit);
    const next = roundByUnit(clampByUnit(nextRaw, series.unit), series.unit);
    series.value = next;

    return { id: series.id, ts, value: next };
  });

  publish({ ts, points });

  const nextDelayMs = 4500 + Math.floor(Math.random() * 5500);
  timer = setTimeout(emit, nextDelayMs);
};

export const ensureMetricsProducer = () => {
  if (started) return;
  started = true;
  emit();
};

export const subscribeMetrics = (listener: (payload: MetricStreamPayload) => void) => {
  ensureMetricsProducer();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getMetricBacklog = (since: number) => {
  ensureMetricsProducer();
  return history.filter((event) => event.ts > since);
};

export const getLatestMetricTs = () => {
  const last = history[history.length - 1];
  return last?.ts ?? 0;
};
