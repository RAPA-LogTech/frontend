import {
  AiConversation,
  AiMessage,
  Dashboard,
  GlobalFilterState,
  LogEntry,
  MetricSeries,
  NotificationItem,
  ReportFormat,
  ReportItem,
  ReportType,
  RunbookItem,
  SlackAlertSettings,
  SlackChannelListItem,
  SlackChannelListResponse,
  SlackChannelUpdatePayload,
  SlackChannelUpdateResponse,
  SlackIncidentDetailResponse,
  SlackIncidentListResponse,
  SlackIncidentStatus,
  SlackIntegrationStatus,
  SlackTestMessageResponse,
  Trace,
  TraceFilterOptions,
} from './types'

type PromRangeValue = [number | string, number | string]
type PromRangeResult = {
  metric?: Record<string, string>
  values?: PromRangeValue[]
}

type ServiceHealthRow = {
  service: string
  env?: string
  error_rate: number
  rds_cpu?: number
  rds_connections?: number
  rds_freeable_memory?: number
  rds_read_latency?: number
  rds_write_latency?: number
}

const toNumber = (value: number | string) => {
  if (typeof value === 'number') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const getServiceFromMetric = (metric: Record<string, string>) => {
  const fromService =
    metric.service || metric.service_name || metric.container_name || metric.service_namespace
  if (fromService) return fromService
  const job = metric.job || ''
  return job.includes('/') ? job.split('/').pop() || '' : job
}

const getInstanceFromMetric = (metric: Record<string, string>) => {
  return (
    metric.instance ||
    metric.host_name ||
    metric.container_name ||
    metric.service_name ||
    metric.job ||
    metric.service_instance_id ||
    metric.pod ||
    ''
  )
}

const getEnvFromMetric = (metric: Record<string, string>) => {
  return metric.deployment_environment || metric.environment || metric.namespace || 'all'
}

const getLatestValue = (row: PromRangeResult) => {
  const values = row.values ?? []
  if (values.length === 0) return 0
  const last = values[values.length - 1]
  return toNumber(last[1])
}

const normalizeServiceHealthPayload = (payload: unknown): ServiceHealthRow[] => {
  if (Array.isArray(payload)) return payload as ServiceHealthRow[]
  if (!payload || typeof payload !== 'object') return []

  const obj = payload as {
    err_4xx?: PromRangeResult[]
    err_5xx?: PromRangeResult[]
    error_4xx?: PromRangeResult[]
    error_5xx?: PromRangeResult[]
  }

  const rows4xx = obj.err_4xx ?? obj.error_4xx ?? []
  const rows5xx = obj.err_5xx ?? obj.error_5xx ?? []

  const bucket = new Map<string, ServiceHealthRow>()

  const upsert = (rows: PromRangeResult[], key: '4xx' | '5xx') => {
    for (const row of rows) {
      const metric = row.metric ?? {}
      const service = getServiceFromMetric(metric) || 'unknown'
      const env = getEnvFromMetric(metric)
      const mapKey = `${service}::${env}`
      const current = bucket.get(mapKey) ?? { service, env, error_rate: 0 }
      const latest = getLatestValue(row)
      current.error_rate += latest
      bucket.set(mapKey, current)
    }
  }

  upsert(rows4xx, '4xx')
  upsert(rows5xx, '5xx')

  return Array.from(bucket.values()).sort((a, b) => {
    if (a.service === b.service) return (a.env ?? '').localeCompare(b.env ?? '')
    return a.service.localeCompare(b.service)
  })
}

const toMetricSeriesFromProm = (
  rows: PromRangeResult[],
  metricName: string,
  unit = '%'
): MetricSeries[] => {
  return rows
    .map((row, idx) => {
      const metric = row.metric ?? {}
      const service = getServiceFromMetric(metric)
      const instance = getInstanceFromMetric(metric)
      const env = getEnvFromMetric(metric)
      const points = (row.values ?? [])
        .map(([ts, value]) => ({ ts: Math.round(toNumber(ts) * 1000), value: toNumber(value) }))
        .filter(p => Number.isFinite(p.ts) && Number.isFinite(p.value))

      if (points.length === 0) return null
      return {
        id: `${service || instance || 'series'}_${metricName}_${idx}`,
        name: metricName,
        unit,
        service: service || undefined,
        instance: instance || undefined,
        env,
        points,
      } as MetricSeries
    })
    .filter((item): item is MetricSeries => item !== null)
}

export async function getContainerMetrics(): Promise<MetricSeries[]> {
  try {
    const response = await fetch('/api/observability/metrics/container')
    if (!response.ok) return []
    const data = (await response.json()) as unknown

    if (Array.isArray(data)) return data as MetricSeries[]
    if (!data || typeof data !== 'object') return []

    const cpu = toMetricSeriesFromProm(
      (data as { cpu?: PromRangeResult[] }).cpu ?? [],
      'app_container_cpu_utilization_avg_5m',
      '%'
    )
    const memory = toMetricSeriesFromProm(
      (data as { memory?: PromRangeResult[] }).memory ?? [],
      'app_container_memory_utilization_avg_5m',
      '%'
    )
    return [...cpu, ...memory]
  } catch {
    return []
  }
}

export async function getHostMetrics(): Promise<MetricSeries[]> {
  try {
    const response = await fetch('/api/observability/metrics/host')
    if (!response.ok) return []
    const data = (await response.json()) as unknown

    if (Array.isArray(data)) return data as MetricSeries[]
    if (!data || typeof data !== 'object') return []

    const memory = toMetricSeriesFromProm(
      (data as { memory?: PromRangeResult[] }).memory ?? [],
      'host_memory_usage_avg_5m',
      'bytes'
    )
    const networkRx = toMetricSeriesFromProm(
      (data as { network_rx?: PromRangeResult[] }).network_rx ?? [],
      'host_network_rx_bytes_5m',
      'bytes'
    )
    const networkTx = toMetricSeriesFromProm(
      (data as { network_tx?: PromRangeResult[] }).network_tx ?? [],
      'host_network_tx_bytes_5m',
      'bytes'
    )
    return [...memory, ...networkRx, ...networkTx]
  } catch {
    return []
  }
}

export async function getDatabaseMetrics(): Promise<MetricSeries[]> {
  try {
    const response = await fetch('/api/observability/metrics/database')
    if (!response.ok) return []
    const data = await response.json()
    if (Array.isArray(data)) return data as MetricSeries[]
    if (data?.metrics && Array.isArray(data.metrics)) return data.metrics as MetricSeries[]
    return []
  } catch {
    return []
  }
}

export async function getRdsMetrics(): Promise<MetricSeries[]> {
  try {
    const response = await fetch('/api/observability/metrics/rds')
    if (!response.ok) return []
    const data = await response.json()
    if (Array.isArray(data)) return data as MetricSeries[]
    if (data?.metrics && Array.isArray(data.metrics)) return data.metrics as MetricSeries[]
    return []
  } catch {
    return []
  }
}

const readErrorMessage = async (response: Response, fallback: string) => {
  try {
    const errorBody = (await response.json()) as { message?: string }
    return errorBody.message ?? fallback
  } catch {
    return fallback
  }
}

export const getLogs = async ({
  start_time,
  end_time,
  ...rest
}: {
  start_time?: string
  end_time?: string
  [key: string]: any
} = {}): Promise<LogEntry[]> => {
  const baseUrl = '/api/observability/logs'
  const params = new URLSearchParams()
  if (start_time) params.append('start_time', start_time)
  if (end_time) params.append('end_time', end_time)
  // 기타 필터 추가
  Object.entries(rest).forEach(([k, v]) => {
    if (v !== undefined && v !== null) params.append(k, String(v))
  })
  const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) throw new Error('Failed to fetch logs')
  const data = await response.json()
  // API 응답이 { logs: LogEntry[] } 형태일 수도 있으니 보정
  if (Array.isArray(data)) return data
  if (Array.isArray(data.logs)) return data.logs
  return []
}

// 기존 방식도 유지 (호환성)
export type OverviewData = {
  kpi: { error_rate: number; latency_p95: number; throughput: number }
  services: Array<{
    service: string
    envs: string[]
    error_rate: number
    latency_p95: number
    throughput: number
  }>
  recent_logs: LogEntry[]
}

export const apiClient = {
  async getOverview(): Promise<OverviewData | null> {
    try {
      const res = await fetch('/api/observability/overview')
      if (!res.ok) return null
      return (await res.json()) as OverviewData
    } catch {
      return null
    }
  },
  async getDashboards(): Promise<Dashboard[]> {
    try {
      const res = await fetch('/api/observability/dashboards')
      if (!res.ok) return []
      return (await res.json()) as Dashboard[]
    } catch {
      return []
    }
  },
  async getLogsLegacy(timeRange?: '15m' | '1h' | '6h' | '24h' | 'all'): Promise<LogEntry[]> {
    try {
      // BFF → observability-service /v1/logs
      const params = new URLSearchParams({ limit: '1000' })
      if (timeRange && timeRange !== 'all') {
        params.append('timeRange', timeRange)
      }
      const response = await fetch(`/api/observability/logs?${params.toString()}`)
      if (!response.ok) return []
      const data = (await response.json()) as { logs?: LogEntry[] }
      return Array.isArray(data.logs) ? data.logs : []
    } catch {
      return []
    }
  },
  async getMetricServices(): Promise<string[]> {
    try {
      const res = await fetch('/api/observability/metrics/services')
      if (!res.ok) return []
      const data = (await res.json()) as string[]
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  },
  async getMetricServiceHealth(): Promise<ServiceHealthRow[]> {
    try {
      const res = await fetch('/api/observability/metrics/service-health')
      if (!res.ok) return []
      const data = await res.json()
      return normalizeServiceHealthPayload(data)
    } catch {
      return []
    }
  },
  async getMetrics(): Promise<MetricSeries[]> {
    try {
      // BFF → observability-service /v1/metrics
      const response = await fetch('/api/observability/metrics')
      if (!response.ok) return []
      const data = await response.json()
      if (Array.isArray(data)) return data as MetricSeries[]
      if (data?.metrics && Array.isArray(data.metrics)) return data.metrics as MetricSeries[]
      return []
    } catch {
      return []
    }
  },
  async getTraces(): Promise<Trace[]> {
    try {
      const end = Date.now()
      const start = end - 10 * 60 * 1000
      const response = await fetch(`/api/observability/traces?start_time=${start}&end_time=${end}`)
      if (!response.ok) return []
      const data = (await response.json()) as { traces?: Trace[] }
      return Array.isArray(data.traces) ? data.traces : []
    } catch {
      return []
    }
  },
  async getTraceDetail(traceId: string): Promise<Trace | null> {
    try {
      const response = await fetch(`/api/observability/traces/${traceId}`)
      if (!response.ok) return null
      return (await response.json()) as Trace
    } catch {
      return null
    }
  },
  async getTraceFilterOptions(): Promise<TraceFilterOptions | null> {
    try {
      const response = await fetch('/api/observability/traces/filters')
      if (!response.ok) return null
      return (await response.json()) as TraceFilterOptions
    } catch {
      return null
    }
  },
  async getGlobalFilterOptions() {
    try {
      const res = await fetch('/api/observability/filter-options')
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  },
  async getAiMessages() {
    return []
  },

  // ============ AI Conversations ============

  async getConversations(): Promise<AiConversation[]> {
    try {
      const response = await fetch('/api/ai/conversations')
      if (!response.ok) return []
      return (await response.json()) as AiConversation[]
    } catch {
      return []
    }
  },

  async getConversation(conversationId: string): Promise<AiConversation | null> {
    try {
      const response = await fetch(`/api/ai/conversations/${conversationId}`)
      if (!response.ok) return null
      return (await response.json()) as AiConversation
    } catch {
      return null
    }
  },

  async createConversation(payload: {
    title?: string
    firstMessage: string
    context?: GlobalFilterState
  }): Promise<AiConversation | null> {
    try {
      const response = await fetch('/api/ai/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) return null
      return (await response.json()) as AiConversation
    } catch {
      return null
    }
  },

  async sendMessage(payload: {
    conversationId: string
    content: string
    attachContext?: boolean
  }): Promise<AiMessage | null> {
    try {
      const response = await fetch('/api/ai/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) return null
      return (await response.json()) as AiMessage
    } catch {
      return null
    }
  },

  async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/ai/conversations/${conversationId}`, {
        method: 'DELETE',
      })
      return response.ok
    } catch {
      return false
    }
  },
  async getNotifications(): Promise<NotificationItem[]> {
    return []
  },
  async getRunbooks(): Promise<RunbookItem[]> {
    return []
  },
  async sendSlackTestMessage(payload: { text: string }) {
    const response = await fetch('/api/integrations/slack/test', {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Slack 테스트 메시지 전송에 실패했습니다.'))
    }

    return (await response.json()) as SlackTestMessageResponse
  },
  async getSlackIntegration() {
    const response = await fetch('/api/integrations/slack', {
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Slack 연동 정보 조회에 실패했습니다.'))
    }

    return (await response.json()) as SlackIntegrationStatus
  },
  async updateSlackIntegrationChannel(payload: SlackChannelUpdatePayload) {
    const response = await fetch('/api/integrations/slack', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Slack 채널 업데이트에 실패했습니다.'))
    }

    return (await response.json()) as SlackChannelUpdateResponse
  },
  async getSlackChannels() {
    const response = await fetch('/api/integrations/slack/channels')

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Slack 채널 목록 조회에 실패했습니다.'))
    }

    return (await response.json()) as SlackChannelListResponse
  },
  async disconnectSlackIntegration() {
    const response = await fetch('/api/integrations/slack', {
      method: 'DELETE',
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Slack 연동 해제에 실패했습니다.'))
    }

    return (await response.json()) as {
      ok: boolean
      disconnectedAt: string
    }
  },

  async getSlackIncidents(params?: {
    status?: 'all' | SlackIncidentStatus
    limit?: number
    cursor?: string
  }) {
    const query = new URLSearchParams()
    query.set('status', params?.status ?? 'all')
    query.set('limit', String(params?.limit ?? 50))
    if (params?.cursor) {
      query.set('cursor', params.cursor)
    }

    const response = await fetch(`/api/incidents?${query.toString()}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Slack 인시던트 목록 조회에 실패했습니다.'))
    }

    return (await response.json()) as SlackIncidentListResponse
  },

  async getSlackIncidentDetail(incidentId: string) {
    const response = await fetch(`/api/incidents/${encodeURIComponent(incidentId)}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Slack 인시던트 상세 조회에 실패했습니다.'))
    }

    return (await response.json()) as SlackIncidentDetailResponse
  },

  async getSlackAlertSettings() {
    const response = await fetch('/api/integrations/slack/alert-settings', { cache: 'no-store' })
    if (!response.ok)
      throw new Error(await readErrorMessage(response, '알람 설정 조회에 실패했습니다.'))
    const data = (await response.json()) as { ok: boolean; settings: SlackAlertSettings }
    return data.settings
  },

  async updateSlackAlertSettings(settings: SlackAlertSettings) {
    const response = await fetch('/api/integrations/slack/alert-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    if (!response.ok)
      throw new Error(await readErrorMessage(response, '알람 설정 저장에 실패했습니다.'))
    const data = (await response.json()) as { ok: boolean; settings: SlackAlertSettings }
    return data.settings
  },

  // ============ Reports ============

  async getReports(): Promise<ReportItem[]> {
    return []
  },

  async createReport(payload: {
    title: string
    type: ReportType
    format: ReportFormat
    periodFrom: string
    periodTo: string
    services: string[]
  }): Promise<ReportItem> {
    const now = new Date().toISOString()
    return {
      id: `rpt-${Date.now()}`,
      title: payload.title,
      type: payload.type,
      status: 'generating',
      format: payload.format,
      period: { from: payload.periodFrom, to: payload.periodTo },
      services: payload.services,
      createdBy: 'admin@logtech.io',
      createdAt: now,
    }
  },

  async deleteReport(reportId: string): Promise<void> {
    void reportId
  },
}
