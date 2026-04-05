// ============ Basic Types ============

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'
export type Environment = 'prod' | 'staging' | 'dev'
export type TraceStatus = 'ok' | 'error' | 'slow'
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical'
export type NotificationSeverity = 'info' | 'warning' | 'error' | 'critical'

// ============ Logs ============

export type LogEntry = {
  id: string
  timestamp: string
  source?: string
  service: string
  env: Environment | null
  level: LogLevel | null
  message: string
  traceId?: string
  metadata?: {
    userId?: string
    requestId?: string
    traceId?: string
    spanId?: string
    [key: string]: string | number | boolean | undefined
  }
  tags?: { [key: string]: string }
}

// ============ Metrics ============

export type MetricPoint = {
  ts: number // unix timestamp (ms)
  value: number
}

export type MetricSeries = {
  id: string
  name: string
  unit: string
  service?: string
  instance?: string
  points: MetricPoint[]
  color?: string
}

export type MetricValue = {
  timestamp: number
  service: string
  metric: string
  value: number
  unit: string
}

// ============ Traces ============

export type TraceSpan = {
  id: string
  traceId: string
  parentSpanId?: string
  service: string
  operation: string
  startTime: number // unix ms
  duration: number // ms
  status: TraceStatus
  tags?: { [key: string]: string | number }
  logs?: Array<{
    timestamp: number
    fields: { [key: string]: string | number }
  }>
}

export type Trace = {
  id: string
  service: string
  operation: string
  startTime: number
  duration: number // ms
  status: TraceStatus
  status_code?: number
  env?: Environment | string | null
  spans: TraceSpan[]
  tags?: { [key: string]: string | number }
}

export type TraceFilterOptions = {
  services?: string[]
  operations?: string[]
  statuses?: string[]
  envs?: string[]
}

// ============ Dashboards & Widgets ============

export type DashboardWidget = {
  id: string
  type: 'kpi' | 'chart' | 'table' | 'gauge' | 'heatmap'
  title: string
  config: {
    metric?: string
    timeRange?: string
    service?: string
    // 타입별 추가 설정
  }
  position: { x: number; y: number; w: number; h: number }
}

export type Dashboard = {
  id: string
  name: string
  owner: string
  ownerEmail?: string
  description?: string
  updatedAt: string
  createdAt: string
  widgets: DashboardWidget[]
}

// ============ Alerts ============

export type AlertCondition = {
  metric: string
  operator: '>' | '<' | '==' | '!=' | '>=' | '<='
  value: number
  duration: number // seconds
  aggregation?: 'avg' | 'max' | 'min' | 'sum'
}

export type AlertAction = {
  type: 'email' | 'slack' | 'webhook' | 'pagerduty'
  target: string
  template?: string
}

export type Alert = {
  id: string
  name: string
  description?: string
  condition: AlertCondition
  actions: AlertAction[]
  enabled: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
  triggerCount?: number
  lastTriggeredAt?: string
}

export type AlertEvent = {
  id: string
  alertId: string
  alertName: string
  severity: AlertSeverity
  message: string
  value: number
  threshold: number
  timestamp: string
  status: 'firing' | 'resolved'
  resolvedAt?: string
}

export type NotificationItem = {
  id: string
  title: string
  message: string
  severity: NotificationSeverity
  timestamp: string
  read: boolean
  source?: string
  route?: string
}

export type RunbookSeverity = 'low' | 'medium' | 'high' | 'critical'

export type RunbookItem = {
  id: string
  title: string
  service: string
  severity: RunbookSeverity
  summary: string
  symptoms: string[]
  steps: string[]
  tags: string[]
  owner: string
  enabled: boolean
  updatedAt: string
}

// ============ Reports ============

export type ReportType = 'logs' | 'metrics' | 'traces' | 'incident'
export type ReportStatus = 'draft' | 'generating' | 'completed' | 'failed'
export type ReportFormat = 'pdf' | 'csv' | 'json'

export type ReportItem = {
  id: string
  title: string
  type: ReportType
  status: ReportStatus
  format: ReportFormat
  period: { from: string; to: string }
  services: string[]
  createdBy: string
  createdAt: string
  completedAt?: string
  fileSize?: string
  summary?: {
    totalRecords?: number
    errorCount?: number
    warningCount?: number
    avgDurationMs?: number
    p99DurationMs?: number
    topService?: string
  }
}

// ============ Integrations ============

export type IntegrationType = 'slack' | 'pagerduty' | 'webhook' | 'email' | 'datadog' | 'newrelic'

export type Integration = {
  id: string
  type: IntegrationType
  name: string
  enabled: boolean
  config: {
    webhookUrl?: string
    slackChannel?: string
    apiKey?: string
    [key: string]: string | boolean | undefined
  }
  createdAt: string
  lastTestedAt?: string
  lastTestStatus?: 'success' | 'failed'
}

export type SlackIntegrationStatus = {
  oauthConfigured: boolean
  connected: boolean
  teamId?: string
  teamName?: string
  teamDomain?: string
  teamImage?: string
  channelId?: string
  channelName?: string
  webhookUrlMasked?: string
  installedBy?: string
  installedAt?: string
  updatedAt?: string
  scopes: string[]
}

export type SlackTestMessageResponse = {
  ok: boolean
  channel: string
  sentAt: string
}

export type SlackChannelUpdatePayload = {
  channelId: string
  channelName?: string
  sendTestMessage?: boolean
}

export type SlackChannelUpdateResponse = {
  ok: boolean
  updatedAt: string
  channelId: string
  channelName?: string
}

export type SlackChannelListItem = {
  id: string
  name: string
  isPrivate: boolean
  isMember: boolean
}

export type SlackChannelListResponse = {
  ok: boolean
  channels: SlackChannelListItem[]
  error?: string
}

export type SlackIncidentStatus = 'ongoing' | 'analyzed' | 'resolved'

export type SlackIncidentSummary = {
  incident_id: string
  alert_name?: string | null
  severity?: string | null
  status?: SlackIncidentStatus | null
  service_info?: string | null
  created_at?: string | null
  last_notified_at?: string | null
  resolved_at?: string | null
  slack_url?: string | null
  slack_ts?: string | null
  slack_channel?: string | null
  s3_key?: string | null
}

export type SlackIncidentListResponse = {
  items: SlackIncidentSummary[]
  next_cursor?: string | null
}

export type SlackIncidentDetailResponse = {
  summary: SlackIncidentSummary
  detail: Record<string, unknown>
}

// ============ AI Chat ============

export type AiMessageRole = 'user' | 'assistant' | 'system'

export type AiMessage = {
  id: string
  role: AiMessageRole
  content: string
  timestamp: number
  context?: {
    timeRange?: string
    service?: string
    traceId?: string
    logId?: string
  }
  metadata?: {
    actionType?: 'view_logs' | 'view_traces' | 'create_alert' | 'view_dashboard'
    actionTarget?: string
  }
}

export type AiConversation = {
  id: string
  title: string
  messages: AiMessage[]
  startedAt: number
  updatedAt: number
  context?: {
    service?: string
    timeRange?: string
  }
}

// ============ Global State ============

export type GlobalFilterState = {
  timeRange: string // e.g., '1h', '6h', '24h', '7d', 'custom'
  startTime?: number // unix ms
  endTime?: number // unix ms
  service: string[]
  env: Environment[]
  cluster: string[]
  customTags?: { [key: string]: string[] }
}

// ============ Service Metadata ============

export type ServiceInfo = {
  name: string
  environment: Environment
  status: 'healthy' | 'degraded' | 'down' | 'unknown'
  instances: number
  version?: string
  owner?: string
  tags?: { [key: string]: string }
}

export type ClusterInfo = {
  name: string
  region: string
  provider: 'aws' | 'gcp' | 'azure' | 'on-prem'
  nodes: number
  services: string[]
}

// ============ API Response Types ============

export type ApiResponse<T> =
  | {
      data: T
      error?: null
      status: 'success'
    }
  | {
      data?: null
      error: {
        code: string
        message: string
        details?: Record<string, unknown>
      }
      status: 'error'
    }

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ============ UI State ============

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export type TimeRange = {
  label: string
  value: string
  getDates?: () => { start: Date; end: Date }
}

export type SortOrder = {
  column: string
  direction: 'asc' | 'desc'
}
