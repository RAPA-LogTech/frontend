import {
  LogEntry,
  MetricSeries,
  Trace,
  TraceSpan,
  Dashboard,
  AiMessage,
  Alert,
  AlertEvent,
  Integration,
  ServiceInfo,
  GlobalFilterState,
  MetricPoint,
  AiConversation,
} from './types';

// ============ Filter Options ============

export const globalFilterOptions = {
  timeRanges: [
    { label: 'Last 15m', value: '15m' },
    { label: 'Last 1h', value: '1h' },
    { label: 'Last 6h', value: '6h' },
    { label: 'Last 24h', value: '24h' },
    { label: 'Last 7d', value: '7d' },
  ],
  services: ['checkout', 'payments', 'search', 'gateway', 'notifications', 'auth', 'api-server'],
  envs: ['prod', 'staging', 'dev'] as const,
  clusters: ['apne2-a', 'apne2-b', 'usw2-a', 'usw2-b'],
};

// ============ Dashboards ============

export const mockDashboards: Dashboard[] = [
  {
    id: 'db-1',
    name: 'Checkout Health',
    owner: 'SRE Team',
    ownerEmail: 'sre@company.com',
    description: 'Real-time health metrics for checkout service',
    updatedAt: '2026-03-02T10:12:00Z',
    createdAt: '2026-02-15T14:20:00Z',
    widgets: [
      { id: 'w1', type: 'kpi', title: 'Error Rate', config: { metric: 'error_rate', service: 'checkout' }, position: { x: 0, y: 0, w: 3, h: 2 } },
      { id: 'w2', type: 'kpi', title: 'Latency p95', config: { metric: 'latency_p95', service: 'checkout' }, position: { x: 3, y: 0, w: 3, h: 2 } },
      { id: 'w3', type: 'chart', title: 'Error Trend (24h)', config: { metric: 'error_rate' }, position: { x: 0, y: 2, w: 6, h: 3 } },
    ],
  },
  {
    id: 'db-2',
    name: 'Payments Golden Signals',
    owner: 'Platform',
    ownerEmail: 'platform@company.com',
    description: 'Golden signals for payments service',
    updatedAt: '2026-03-01T18:40:00Z',
    createdAt: '2026-01-10T09:15:00Z',
    widgets: [],
  },
  {
    id: 'db-3',
    name: 'Core Infra Overview',
    owner: 'Infra',
    ownerEmail: 'infra@company.com',
    updatedAt: '2026-03-01T09:21:00Z',
    createdAt: '2025-12-01T12:00:00Z',
    widgets: [],
  },
];

// ============ Logs ============

export const mockLogs: LogEntry[] = [
  {
    id: 'log-1',
    timestamp: '2026-03-02T10:30:21Z',
    service: 'checkout',
    env: 'prod',
    level: 'ERROR',
    message: 'Payment provider timeout after 3 retries',
    metadata: {
      userId: 'user-12345',
      requestId: 'req-abc123',
      traceId: 'trace-001-001',
      spanId: 'span-001-002',
      retryCount: 3,
      timeout_ms: 5000,
    },
    tags: { endpoint: '/api/checkout/pay', method: 'POST' },
  },
  {
    id: 'log-2',
    timestamp: '2026-03-02T10:30:18Z',
    service: 'gateway',
    env: 'prod',
    level: 'WARN',
    message: 'Upstream latency above threshold p95=1.4s',
    metadata: {
      requestId: 'req-def456',
      traceId: 'trace-002-001',
      latency_p95_ms: 1400,
      threshold_ms: 1000,
    },
  },
  {
    id: 'log-3',
    timestamp: '2026-03-02T10:30:10Z',
    service: 'search',
    env: 'staging',
    level: 'INFO',
    message: 'Index refresh completed in 320ms',
    metadata: {
      indexName: 'products-v3',
      documents: 2345678,
      duration_ms: 320,
    },
  },
  {
    id: 'log-4',
    timestamp: '2026-03-02T10:30:02Z',
    service: 'payments',
    env: 'prod',
    level: 'ERROR',
    message: 'Circuit breaker opened for external gateway',
    metadata: {
      service: 'stripe-gateway',
      failureRate: 0.95,
      threshold: 0.5,
      traceId: 'trace-003-001',
    },
  },
  {
    id: 'log-5',
    timestamp: '2026-03-02T10:29:55Z',
    service: 'notifications',
    env: 'prod',
    level: 'WARN',
    message: 'Email queue depth: 45234 (threshold: 10000)',
    metadata: {
      queueDepth: 45234,
      threshold: 10000,
    },
  },
  {
    id: 'log-6',
    timestamp: '2026-03-02T10:29:48Z',
    service: 'auth',
    env: 'prod',
    level: 'INFO',
    message: 'Token blacklist refresh: 156 tokens revoked',
    metadata: {
      tokensRevoked: 156,
      duration_ms: 234,
      blacklistSize: 5670,
    },
  },
];

// ============ Metrics ============

const generateMetricPoints = (baseValue: number, variance: number, count: number = 60): MetricPoint[] => {
  const points: MetricPoint[] = [];
  const now = Date.now();
  for (let i = count - 1; i >= 0; i--) {
    points.push({
      ts: now - i * 60000,
      value: baseValue + (Math.random() - 0.5) * variance,
    });
  }
  return points;
};

export const mockMetrics: MetricSeries[] = [
  {
    id: 'metric-error-rate',
    name: 'Error Rate',
    unit: '%',
    service: 'checkout',
    points: generateMetricPoints(2.3, 1.5, 60),
    color: '#EF4444',
  },
  {
    id: 'metric-latency-p95',
    name: 'Latency P95',
    unit: 'ms',
    service: 'checkout',
    points: generateMetricPoints(450, 200, 60),
    color: '#3B82F6',
  },
  {
    id: 'metric-throughput',
    name: 'Throughput',
    unit: 'req/s',
    service: 'checkout',
    points: generateMetricPoints(1200, 300, 60),
    color: '#10B981',
  },
  {
    id: 'metric-cpu',
    name: 'CPU Usage',
    unit: '%',
    service: 'checkout',
    instance: 'i-12345',
    points: generateMetricPoints(65, 25, 60),
    color: '#F59E0B',
  },
  {
    id: 'metric-memory',
    name: 'Memory Usage',
    unit: '%',
    service: 'checkout',
    instance: 'i-12345',
    points: generateMetricPoints(78, 15, 60),
    color: '#8B5CF6',
  },
];

// ============ Traces ============

const createTraceSpan = (
  id: string,
  operation: string,
  service: string,
  duration: number,
  startTime: number,
  parentSpanId?: string,
  status: 'ok' | 'error' | 'slow' = 'ok',
  logs?: TraceSpan['logs']
): TraceSpan => ({
  id,
  traceId: 'trace-001-001',
  parentSpanId,
  service,
  operation,
  startTime,
  duration,
  status,
  tags: {
    'http.method': 'POST',
    'http.url': `/api/${operation}`,
    'http.status_code': status === 'error' ? 500 : 200,
  },
  logs,
});

const baseMockTraces: Trace[] = [
  {
    id: 'trace-001-001',
    service: 'checkout',
    operation: 'POST /api/checkout',
    startTime: Date.now() - 120000,
    duration: 520,
    status: 'slow',
    status_code: 200,
    spans: [
      createTraceSpan('span-1', 'web-request', 'api-gateway', 520, Date.now() - 120000, undefined, 'ok', [
        {
          timestamp: Date.now() - 119998,
          fields: {
            event: 'HTTP request received',
            level: 'info',
            method: 'POST',
            path: '/api/checkout',
          },
        },
        {
          timestamp: Date.now() - 119650,
          fields: {
            event: 'Calling downstream services',
            level: 'info',
            services: 'inventory,payments,notifications',
          },
        },
      ]),
      createTraceSpan('span-2', 'validate-cart', 'checkout', 45, Date.now() - 119980, 'span-1'),
      createTraceSpan('span-3', 'fetch-inventory', 'inventory', 200, Date.now() - 119930, 'span-1', 'slow'),
      createTraceSpan('span-3-1', 'redis-get', 'redis', 50, Date.now() - 119920, 'span-3'),
      createTraceSpan('span-3-2', 'db-query', 'db', 140, Date.now() - 119870, 'span-3', 'slow', [
        {
          timestamp: Date.now() - 119840,
          fields: {
            event: 'Slow query detected',
            level: 'warn',
            sql: 'SELECT * FROM inventory WHERE product_id IN (...)',
            duration_ms: 140,
          },
        },
      ]),
      createTraceSpan('span-4', 'charge-payment', 'payments', 250, Date.now() - 119730, 'span-1', 'slow'),
      createTraceSpan('span-4-1', 'call-stripe', 'stripe-gateway', 230, Date.now() - 119720, 'span-4', 'slow', [
        {
          timestamp: Date.now() - 119700,
          fields: {
            event: 'Stripe API request started',
            level: 'info',
            endpoint: '/v1/charges',
          },
        },
        {
          timestamp: Date.now() - 119505,
          fields: {
            event: 'Stripe API response delayed',
            level: 'warn',
            latency_ms: 230,
          },
        },
      ]),
      createTraceSpan('span-5', 'send-confirmation', 'notifications', 25, Date.now() - 119480, 'span-1', 'ok', [
        {
          timestamp: Date.now() - 119465,
          fields: {
            event: 'Confirmation enqueued',
            level: 'info',
            provider: 'email',
          },
        },
      ]),
    ],
  },
  {
    id: 'trace-002-001',
    service: 'search',
    operation: 'POST /api/search',
    startTime: Date.now() - 60000,
    duration: 180,
    status: 'ok',
    status_code: 200,
    spans: [
      createTraceSpan('span-a', 'web-request', 'api-gateway', 180, Date.now() - 60000),
      createTraceSpan('span-b', 'parse-query', 'search', 10, Date.now() - 59990, 'span-a'),
      createTraceSpan('span-c', 'elasticsearch-search', 'elasticsearch', 160, Date.now() - 59980, 'span-a'),
      createTraceSpan('span-d', 'format-results', 'search', 10, Date.now() - 59820, 'span-a'),
    ],
  },
  {
    id: 'trace-003-001',
    service: 'payments',
    operation: 'POST /api/refund',
    startTime: Date.now() - 30000,
    duration: 2500,
    status: 'error',
    status_code: 500,
    spans: [
      createTraceSpan('span-x', 'web-request', 'api-gateway', 2500, Date.now() - 30000, undefined, 'error'),
      createTraceSpan('span-y', 'validate-refund', 'payments', 50, Date.now() - 29990, 'span-x'),
      createTraceSpan('span-z', 'call-stripe', 'stripe-gateway', 2400, Date.now() - 29940, 'span-x', 'error'),
    ],
  },
];

const syntheticTraceServices = [
  'checkout',
  'payments',
  'search',
  'gateway',
  'notifications',
  'auth',
  'api-server',
];

const syntheticTraceOperations = [
  'POST /api/checkout',
  'POST /api/refund',
  'GET /api/search',
  'POST /api/login',
  'GET /api/orders',
  'POST /api/notify',
  'PUT /api/profile',
];

const pseudoNoise = (index: number, salt: number) => {
  const raw = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return raw - Math.floor(raw);
};

const buildSyntheticTrace = (index: number): Trace => {
  const traceId = `trace-auto-${index.toString().padStart(3, '0')}`;
  const service = syntheticTraceServices[index % syntheticTraceServices.length];
  const operation = syntheticTraceOperations[index % syntheticTraceOperations.length];
  const jitterA = pseudoNoise(index, 1);
  const jitterB = pseudoNoise(index, 2);
  const jitterC = pseudoNoise(index, 3);
  const spikeBonus = jitterB > 0.84 ? 700 + Math.floor(jitterC * 1800) : 0;
  const duration = 80 + Math.floor(jitterA * 980) + spikeBonus;
  const lookbackMs =
    90 * 1000 +
    index * (18 * 1000 + Math.floor(jitterA * 52 * 1000)) +
    Math.floor(jitterB * 75 * 1000);
  const startTime = Date.now() - lookbackMs;
  const status = jitterC > 0.9 ? 'error' : jitterA > 0.62 ? 'slow' : 'ok';
  const statusCode = status === 'error' ? 500 : status === 'slow' ? 302 : 200;

  const rootSpanId = `${traceId}-span-root`;
  const appSpanId = `${traceId}-span-app`;
  const dbSpanId = `${traceId}-span-db`;
  const extSpanId = `${traceId}-span-ext`;

  const rawSpans: TraceSpan[] = [
    createTraceSpan(rootSpanId, 'http-request', 'api-gateway', duration, startTime, undefined, status),
    createTraceSpan(
      appSpanId,
      'app-handler',
      service,
      Math.max(30, Math.floor(duration * (0.28 + jitterA * 0.36))),
      startTime + 6 + Math.floor(jitterA * 18),
      rootSpanId,
      status === 'error' && jitterB > 0.6 ? 'error' : 'ok'
    ),
    createTraceSpan(
      dbSpanId,
      'db-query',
      'postgres',
      Math.max(12, Math.floor(duration * (0.12 + jitterB * 0.32))),
      startTime + 18 + Math.floor(jitterB * 34),
      appSpanId,
      status === 'slow' && jitterA > 0.58 ? 'slow' : 'ok'
    ),
    createTraceSpan(
      extSpanId,
      'external-call',
      'redis',
      Math.max(10, Math.floor(duration * (0.1 + jitterC * 0.3))),
      startTime + 22 + Math.floor(jitterC * 44),
      appSpanId,
      status === 'error' ? 'error' : jitterB > 0.78 ? 'slow' : 'ok'
    ),
  ];

  const spans = rawSpans.map((span) => ({ ...span, traceId }));

  return {
    id: traceId,
    service,
    operation,
    startTime,
    duration,
    status,
    status_code: statusCode,
    spans,
    tags: {
      environment: index % 6 === 0 ? 'staging' : 'prod',
      region: ['ap-northeast-2', 'us-west-2', 'eu-west-1'][index % 3],
    },
  };
};

const syntheticMockTraces: Trace[] = Array.from({ length: 97 }, (_, idx) => buildSyntheticTrace(idx + 4));

export const mockTraces: Trace[] = [...baseMockTraces, ...syntheticMockTraces];

// ============ Alerts ============

export const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    name: 'High Error Rate - Checkout',
    description: 'Alert when error rate exceeds 5% for 5 minutes',
    condition: {
      metric: 'error_rate',
      operator: '>',
      value: 5,
      duration: 300,
      aggregation: 'avg',
    },
    actions: [
      {
        type: 'slack',
        target: '#alerts-checkout',
      },
      {
        type: 'email',
        target: 'sre@company.com',
      },
    ],
    enabled: true,
    createdAt: '2026-02-15T10:00:00Z',
    updatedAt: '2026-03-01T14:30:00Z',
    createdBy: 'sre-admin',
    triggerCount: 3,
    lastTriggeredAt: '2026-03-02T09:45:00Z',
  },
  {
    id: 'alert-2',
    name: 'Memory Usage Critical',
    description: 'Alert when memory exceeds 90% for 2 minutes',
    condition: {
      metric: 'memory_usage',
      operator: '>',
      value: 90,
      duration: 120,
      aggregation: 'max',
    },
    actions: [
      {
        type: 'pagerduty',
        target: 'incident-escalation-policy',
      },
    ],
    enabled: true,
    createdAt: '2026-01-20T09:15:00Z',
    updatedAt: '2026-03-01T09:00:00Z',
    createdBy: 'infra-team',
    triggerCount: 1,
    lastTriggeredAt: '2026-03-01T18:20:00Z',
  },
];

export const mockAlertEvents: AlertEvent[] = [
  {
    id: 'event-1',
    alertId: 'alert-1',
    alertName: 'High Error Rate - Checkout',
    severity: 'error',
    message: 'Error rate exceeded threshold',
    value: 7.2,
    threshold: 5,
    timestamp: '2026-03-02T10:15:00Z',
    status: 'firing',
  },
  {
    id: 'event-2',
    alertId: 'alert-2',
    alertName: 'Memory Usage Critical',
    severity: 'critical',
    message: 'Memory usage exceeded 90%',
    value: 95,
    threshold: 90,
    timestamp: '2026-03-02T09:30:00Z',
    status: 'resolved',
    resolvedAt: '2026-03-02T10:15:00Z',
  },
];

// ============ Integrations ============

export const mockIntegrations: Integration[] = [
  {
    id: 'int-1',
    type: 'slack',
    name: 'Company Slack Workspace',
    enabled: true,
    config: {
      slackChannel: '#alerts-sre',
      apiKey: 'xoxb-secret-token', // 실제로는 마스킹됨
    },
    createdAt: '2026-01-15T10:00:00Z',
    lastTestedAt: '2026-03-02T10:00:00Z',
    lastTestStatus: 'success',
  },
  {
    id: 'int-2',
    type: 'webhook',
    name: 'Custom Webhook',
    enabled: false,
    config: {
      webhookUrl: 'https://webhook.example.com/alerts',
    },
    createdAt: '2026-02-01T14:20:00Z',
  },
  {
    id: 'int-3',
    type: 'pagerduty',
    name: 'PagerDuty Integration',
    enabled: true,
    config: {
      apiKey: 'pd-secret-key',
    },
    createdAt: '2026-01-20T09:15:00Z',
    lastTestedAt: '2026-03-01T14:00:00Z',
    lastTestStatus: 'success',
  },
];

// ============ Services ============

export const mockServices: ServiceInfo[] = [
  {
    name: 'checkout',
    environment: 'prod',
    status: 'degraded',
    instances: 8,
    version: '2.4.1',
    owner: 'SRE Team',
    tags: { team: 'payments', criticality: 'high' },
  },
  {
    name: 'payments',
    environment: 'prod',
    status: 'healthy',
    instances: 12,
    version: '3.1.0',
    owner: 'Platform',
    tags: { team: 'payments', criticality: 'high' },
  },
  {
    name: 'search',
    environment: 'prod',
    status: 'healthy',
    instances: 6,
    version: '1.8.2',
    owner: 'Platform',
    tags: { team: 'discovery', criticality: 'medium' },
  },
  {
    name: 'gateway',
    environment: 'prod',
    status: 'healthy',
    instances: 16,
    version: '4.2.3',
    owner: 'Platform',
    tags: { team: 'infrastructure', criticality: 'critical' },
  },
  {
    name: 'notifications',
    environment: 'prod',
    status: 'degraded',
    instances: 4,
    version: '1.2.0',
    owner: 'SRE Team',
    tags: { team: 'communications', criticality: 'medium' },
  },
];

// ============ AI Chat ============

export const mockAiMessages: AiMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'Why did error rate spike at 14:30?',
    timestamp: Date.now() - 60000,
    context: {
      timeRange: '1h',
      service: 'checkout',
    },
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: `I've analyzed the metrics from 14:25 to 14:35. The error rate spike was caused by:

1. **Pod restart** in api-server (3 pods at 14:30)
   - Circuit breaker to Stripe opened due to slow responses
   - External gateway latency increased from 200ms to 2000ms+

2. **Related events**:
   - Stripe API experiencing degradation (confirmed in their status page)
   - Connection timeout rate increased 45% during this window
   
3. **Impact**:
   - 3,245 failed transactions (0.8% of traffic)
   - Avg error recovery: 4 minutes

Would you like to see related logs or traces? I can also help create an alert for future incidents.`,
    timestamp: Date.now() - 50000,
    metadata: {
      actionType: 'view_logs',
      actionTarget: 'service:checkout,level:ERROR,timerange:30m',
    },
  },
  {
    id: 'msg-3',
    role: 'user',
    content: 'Show me the related logs',
    timestamp: Date.now() - 40000,
  },
  {
    id: 'msg-4',
    role: 'assistant',
    content: `Here are the key error logs during the incident. I've grouped them by service:

**Checkout Service (2,341 errors)**
\`\`\`
ERROR: Payment provider timeout after 3 retries
  service: checkout
  timestamp: 14:30:21
  count: 1,243
\`\`\`

**Gateway Service (904 errors)**
\`\`\`
WARN: Circuit breaker opened for stripe-gateway
  threshold_failure_rate: 0.95
  timestamp: 14:30:15
\`\`\`

The root cause appears to be the Stripe API degradation. Recommend:
1. Increase circuit breaker timeout threshold
2. Add retry logic with exponential backoff
3. [Create alert for future incidents →](action:create_alert?metric=stripe_latency&threshold=5000)`,
    timestamp: Date.now() - 35000,
    metadata: {
      actionType: 'view_logs',
      actionTarget: 'service:checkout,service:gateway,level:ERROR',
    },
  },
];

export const mockAiConversations: AiConversation[] = [
  {
    id: 'conv-1',
    title: 'Checkout Error Spike Investigation',
    messages: mockAiMessages,
    startedAt: Date.now() - 120000,
    updatedAt: Date.now(),
    context: {
      service: 'checkout',
      timeRange: '1h',
    },
  },
];

// ============ Global Filter State (default) ============

export const defaultGlobalFilter: GlobalFilterState = {
  timeRange: '1h',
  startTime: Date.now() - 3600000,
  endTime: Date.now(),
  service: [],
  env: ['prod'],
  cluster: [],
};

// ============ Helper Functions ============

export const getLogsByService = (service: string) =>
  mockLogs.filter((log) => log.service === service);

export const getMetricsByService = (service: string) =>
  mockMetrics.filter((metric) => metric.service === service);

export const getServiceStatus = (service: string) =>
  mockServices.find((s) => s.name === service)?.status || 'unknown';

export const getAlertsByService = (service: string) =>
  mockAlerts.filter((alert) => alert.condition.metric.includes(service));


export const mockMetricSeries: MetricSeries[] = [
  {
    id: 'm-1',
    name: 'request_rate',
    unit: 'req/s',
    points: [
      { ts: 1746087600000, value: 120 },
      { ts: 1746087900000, value: 132 },
      { ts: 1746088200000, value: 128 },
      { ts: 1746088500000, value: 150 },
    ],
  },
  {
    id: 'm-2',
    name: 'error_rate',
    unit: '%',
    points: [
      { ts: 1746087600000, value: 0.4 },
      { ts: 1746087900000, value: 0.8 },
      { ts: 1746088200000, value: 0.6 },
      { ts: 1746088500000, value: 1.1 },
    ],
  },
];

export const mockAiConversation: AiMessage[] = [
  { id: 'a1', role: 'assistant', content: '어떤 이상 징후를 분석할까요? 현재 p95 latency가 상승 중입니다.', timestamp: Date.now() - 60000 },
  { id: 'a2', role: 'user', content: 'checkout 서비스 에러율 급증 원인 알려줘.', timestamp: Date.now() - 30000 },
];
