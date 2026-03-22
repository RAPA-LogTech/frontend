import { globalFilterOptions, mockAiConversation, mockDashboards } from './mock'
import {
  Dashboard,
  LogEntry,
  MetricSeries,
  NotificationItem,
  ReportFormat,
  ReportItem,
  ReportType,
  RunbookItem,
  SlackIntegrationStatus,
  SlackTestMessageResponse,
  Trace,
} from './types'

const simulateLatency = async () => {
  await new Promise(resolve => setTimeout(resolve, 150))
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
export const apiClient = {
  async getDashboards(): Promise<Dashboard[]> {
    await simulateLatency()
    return mockDashboards
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
  async getMetrics(): Promise<MetricSeries[]> {
    try {
      // BFF → observability-service /v1/metrics
      const response = await fetch('/api/observability/metrics')
      if (!response.ok) return []
      const data = (await response.json()) as MetricSeries[]
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  },
  async getTraces(): Promise<Trace[]> {
    try {
      // BFF → observability-service /v1/traces
      const response = await fetch('/api/observability/traces')
      if (!response.ok) return []
      const data = (await response.json()) as { traces?: Trace[] }
      return Array.isArray(data.traces) ? data.traces : []
    } catch {
      return []
    }
  },
  async getGlobalFilterOptions() {
    await simulateLatency()
    return globalFilterOptions
  },
  async getAiMessages() {
    await simulateLatency()
    return mockAiConversation
  },
  async getNotifications(): Promise<NotificationItem[]> {
    await simulateLatency()
    return []
  },
  async getRunbooks(): Promise<RunbookItem[]> {
    await simulateLatency()
    return []
  },
  async sendSlackTestMessage(payload: { text: string }) {
    const response = await fetch('/api/integrations/slack/test', {
      method: 'POST',
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
    const response = await fetch('/api/integrations/slack')

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Slack 연동 정보 조회에 실패했습니다.'))
    }

    return (await response.json()) as SlackIntegrationStatus
  },
  async disconnectSlackIntegration() {
    const response = await fetch('/api/integrations/slack', {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Slack 연동 해제에 실패했습니다.'))
    }

    return (await response.json()) as {
      ok: boolean
      disconnectedAt: string
    }
  },

  // ============ Reports ============

  async getReports(): Promise<ReportItem[]> {
    await simulateLatency()
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
    await simulateLatency()
    // 실제 백엔드 없이 목 응답 반환
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
    await simulateLatency()
    // 실제 백엔드 없이 목 응답 (정상 삭제 처리)
    void reportId
  },
}
