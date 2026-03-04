# frontend


> Observability Dashboard에서의 3가지 핵심 작업 흐름과 실제 데이터 예시

---

## 📌 Flow 1: 에러 탐지 → 원인 분석(AI) → 로그/트레이스 추적

### 시작점
- **Overview 대시보드** 에서 KPI "Error Rate" 증가 감지
- 또는 **알림 수신** (Slack / Email / PagerDuty)

### 단계별 상세

#### 1️⃣ 대시보드에서 이상 인지
```
Overview 페이지
├─ KPI Card: Error Rate = 7.2% (up 242% from 1h ago)
│  Status: CRITICAL (빨간색)
│
├─ Alert: "High Error Rate - Checkout" 
│  Time: 2026-03-02 10:30:00
│  Severity: ERROR
│
└─ Action: 이상 지점 클릭 또는 우측 AI Chat 열기
```

**KPI Card 렌더링 코드 (참고)**
```typescript
<KPICard
  title="Error Rate"
  value={7.2}
  unit="%"
  status="critical"  // ← 빨간색 배경
  trend={{
    value: 242.8,
    direction: 'up',
    timeRange: 'from 1h ago'
  }}
  onClick={() => navigate('/logs?level=ERROR')}
/>
```

#### 2️⃣ AI Assistant로 원인 분석 (Drawer)
```
User: "Why did error rate spike at 14:30?"

AI Assistant Response:
"I've analyzed metrics from 14:30 (현재 컨텍스트 자동 감지: 
service=checkout, timeRange=1h)

Root Cause Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌─ Pod Restart: 3 pods restarted at 10:30
│  └─ Circuit breaker to Stripe opened
│
├─ External Service Degradation
│  └─ Stripe API latency: 200ms → 2000ms+
│
└─ Impact Metrics
   ├─ 3,245 failed transactions (0.8% of traffic)
   ├─ Avg recovery time: 4 minutes
   └─ P99 latency spike: 1100ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next Steps:
[→ View related logs] [→ View trace] [→ Create alert]
"
```

**관련 데이터 (public/data/logs-example.json)**
```json
{
  "id": "log-001",
  "timestamp": "2026-03-02T10:30:21.123Z",
  "service": "checkout",
  "level": "ERROR",
  "message": "Payment provider timeout after 3 retries",
  "metadata": {
    "traceId": "trace-001-001",  // ← 클릭하면 Traces로 이동
    "provider": "stripe",
    "timeout_ms": 5000
  }
}
```

#### 3️⃣ Logs 페이지로 이동 (AI 링크 클릭)
```
URL: /logs?service=checkout&level=ERROR&timeRange=30m

Logs Table:
┌─────────────────┬──────────┬───────┬───────────────────────────┐
│ Timestamp       │ Service  │ Level │ Message                   │
├─────────────────┼──────────┼───────┼───────────────────────────┤
│ 10:30:21.123Z   │ checkout │ ERROR │ Payment provider timeout  │
│ 10:30:18.456Z   │ gateway  │ WARN  │ ...upstream latency...    │
│ 10:30:10.789Z   │ search   │ INFO  │ Index refresh completed   │
│ 10:30:02.000Z   │ payments │ ERROR │ Circuit breaker opened    │
└─────────────────┴──────────┴───────┴───────────────────────────┘

각 row 클릭 → 상세 정보 Drawer
├─ Full Message
├─ Metadata (JSON viewer)
├─ Trace ID: trace-001-001
│  └─ [→ View Trace] 버튼
└─ Related Logs (같은 traceId, requestId)
```

#### 4️⃣ Traces 페이지로 이동
```
URL: /traces?traceId=trace-001-001

Trace Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ID: trace-001-001
Service: checkout
Operation: POST /api/checkout
Duration: 520ms (SLOW)
Status: 200 OK

Span Waterfall (critical path):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

0ms     ┌─ web-request (api-gateway)           ─────────────────────┐
        │                                                             │ 520ms
        │   45ms ┌─ validate-cart (checkout) ┐                       │
        │        └──────────────────────────┘                        │
        │                                                             │
        │   200ms ┌─ fetch-inventory (inventory) ┐                   │
        │         │  50ms ┌─ redis-get ──┐       │                   │
        │         │       └───────────────┘       │                   │
        │         │  140ms ┌─ db-query ──┐      │                   │
        │         │        │ (SQL too slow) │    │ ← BOTTLENECK      │
        │         │        └──────────────────┘  │                   │
        │         └────────────────────────────┘ 200ms               │
        │                                                             │
        │   ┌─ charge-payment (payments)          ┐                  │
        │   │  230ms ┌─ call-stripe ────┐        │ 250ms             │
        │   │        │ (external API)    │        │ ← BOTTLENECK     │
        │   │        └──────────────────┘        │                  │
        │   └──────────────────────────────────┘                    │
        │                                                             │
        │   25ms ┌─ send-confirmation (notifications) ┐              │
        │        └──────────────────────────────────┘               │
        │                                                             │
        └─────────────────────────────────────────────────────────┘

Bottleneck Analysis:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. call-stripe (230ms, 44.2% of total)
   └─ External API latency (expected: 50-100ms)
      
2. db-query (140ms, 26.9% of total)
   └─ Potential N+1 query issue
      SQL: SELECT * FROM inventory WHERE product_id IN (...)
```

**관련 데이터 (public/data/trace-example.json)**
```json
{
  "spans": [
    {
      "id": "span-4-1",
      "service": "stripe-gateway",
      "operation": "call-stripe",
      "duration": 230,
      "status": "slow",
      "tags": {
        "external_service": "stripe",
        "endpoint": "https://api.stripe.com/v1/charges"
      }
    },
    {
      "id": "span-3-2",
      "service": "postgres",
      "operation": "db-query",
      "duration": 140,
      "tags": {
        "db.statement": "SELECT * FROM inventory WHERE product_id IN (...)"
      }
    }
  ]
}
```

#### 5️⃣ AI로 추가 분석 (Traces 페이지에서도 사용 가능)
```
User: "Why is db query so slow?"

AI Response: 
"The query hitting inventory table with 3 product IDs:

SELECT * FROM inventory 
  WHERE product_id IN (123, 456, 789)

Performance Analysis:
- Current: 140ms
- P50: 20ms, P95: 50ms
- Issue: Missing index on (product_id)

Recommendation:
  CREATE INDEX idx_product_id ON inventory(product_id);
  Estimated improvement: 140ms → 15ms

[→ View Query Plan] [→ Create Alert] [→ Share with DBA]
"
```

---

## 📌 Flow 2: 대시보드 이상 지표 → 알림 생성 → Slack 연결

### 시나리오
엔지니어가 대시보드에서 CPU/Memory 급증을 감지 → 알림 자동 설정 → Slack에 실시간 알림 수신

### 단계별 상세

#### 1️⃣ 메트릭 이상 발견
```
Metrics 페이지 또는 Dashboards 페이지
│
├─ CPU Usage: 85% (threshold: 80%)
├─ Memory Usage: 95% (threshold: 90%) ← CRITICAL
│
└─ Action: 우측 메뉴 "[⋯ More]" → "Create Alert"
```

#### 2️⃣ 알림 규칙 생성 (Modal)
```
Create Alert Modal
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Alert Name: *
"Memory Usage Critical - checkout-prod"

Metric: *
[Select: memory_usage] ▼

Service:
[Select: checkout] ▼

Condition:
[avg] > [90] % for [2] minutes

Trigger Type:
( ) Immediately
(◉) After N consecutive evaluations [3]
( ) On anomaly detection

Actions:
┌─────────────────────────────────────┐
│ Action Type: Slack                  │
│ Channel: #infra-alerts              │
│ [Test] [Remove]                     │
└─────────────────────────────────────┘

[+ Add Action]

Description:
"Alert when memory exceeds 90% for 2 minutes"

[Test Alert] [Cancel] [Create]
```

**관련 코드 (types.ts)**
```typescript
type AlertCondition = {
  metric: 'memory_usage';
  operator: '>';
  value: 90;
  duration: 120;  // seconds
  aggregation: 'max' | 'avg';
};

type AlertAction = {
  type: 'slack';
  target: '#infra-alerts';
  template?: 'default' | 'custom';
};
```

#### 3️⃣ Slack 연결 (첫 사용)
```
"Actions" 섹션에서 Slack 선택 후 "[Connect Slack]" 클릭

OAuth Flow:
1. Modal: "Authorize LogTech to access Slack"
   ├─ Read channel list
   ├─ Send messages to workspace
   └─ [Authorize] [Cancel]

2. Slack workspace 선택: "company-workspace"

3. Channel 선택:
   [📍 #infra-alerts] ◉
   [ ] #sre-team
   [ ] #on-call-incidents
   [ ] Direct message

4. [Save Integration]

Success: "✓ Slack integration connected! Ready to send alerts."
```

**관련 데이터 (public/data/dashboards-example.json)**
```json
{
  "actions": [
    {
      "type": "slack",
      "target": "#alerts-checkout",
      "template": "alert_notification"
    },
    {
      "type": "email",
      "target": "sre@company.com"
    },
    {
      "type": "pagerduty",
      "target": "p1-escalation",
      "severity": "high"
    }
  ]
}
```

#### 4️⃣ 알림 전송 확인
```
Slack #infra-alerts 채널에서:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 CRITICAL ALERT

Memory Usage Critical - checkout-prod

Current Value: 95%  ↑ 12% from baseline
Threshold: 90%

Service: checkout (prod)
Instance: i-12345
Duration: 2m 15s (above threshold)

[📊 View Metrics] [📋 View Logs] [🔔 Resolve Alert]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Click "[📊 View Metrics]" → 브라우저에서 대시보드 열기
```

**실제 Slack 메시지 payload (예시)**
```json
{
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "🚨 *CRITICAL* | Memory Usage Critical - checkout-prod\n\n*Current:* 95% | *Threshold:* 90% | *Duration:* 2m15s"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Service:*\ncheckout"
        },
        {
          "type": "mrkdwn",
          "text": "*Environment:*\nprod"
        }
      ]
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "📊 View Metrics"
          },
          "url": "https://logtech.example.com/metrics?service=checkout"
        },
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "📋 View Logs"
          },
          "url": "https://logtech.example.com/logs?service=checkout&level=ERROR"
        }
      ]
    }
  ]
}
```

#### 5️⃣ 알림 상태 업데이트 (자동)
```
Alert 정상화되면:

✓ [Resolved] Memory Usage Critical - checkout-prod
  Duration: 5m 30s (auto-resolved at 10:35)
  Reason: Pod memory stabilized after restart
  
Resolution Timeline:
- 10:30:00 Fired (95%)
- 10:32:45 Still firing (93%)
- 10:35:15 Resolved (78%)
```

**관련 데이터 (public/data/alerts-example.json)**
```json
{
  "alertEvents": [
    {
      "id": "event-002",
      "alertName": "Memory Usage Critical",
      "severity": "critical",
      "timestamp": "2026-03-02T09:30:00Z",
      "status": "resolved",
      "resolvedAt": "2026-03-02T10:15:00Z",
      "duration": 2700
    }
  ]
}
```

---

## 📌 Flow 3: 로그에서 Trace ID로 트레이스 추적

### 시나리오
사용자가 에러 로그 발견 → trace_id 클릭 → 전체 분산 추적 시각화 → 병목 지점 파악

### 단계별 상세

#### 1️⃣ Logs 페이지에서 에러 로그 찾기
```
Logs 페이지
├─ Filter: service=checkout, level=ERROR, timeRange=1h
│
└─ Table:
   ┌──────────────┬──────────┬──────────────────────┐
   │ Timestamp    │ Service  │ Message              │
   ├──────────────┼──────────┼──────────────────────┤
   │ 10:30:21     │ checkout │ Payment timeout      │
   │              │          │                      │
   │ trace_id:    │          │ metadata 확인 필요   │
   │ trace-001... │          │ [더보기] 클릭 →       │
   └──────────────┴──────────┴──────────────────────┘
```

#### 2️⃣ 로그 상세보기 (Row 클릭)
```
Log Detail Drawer
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Header:
Log ID: log-001
Service: checkout
Level: ERROR
Timestamp: 2026-03-02T10:30:21.123Z

Message:
"Payment provider timeout after 3 retries"

Metadata (JSON):
{
  "userId": "user-12345",
  "requestId": "req-abc123def456",
  "traceId": "trace-001-001",  ← 🔍 CLICK HERE
  "spanId": "span-001-002",
  "retryCount": 3,
  "timeout_ms": 5000,
  "provider": "stripe"
}

Tags:
endpoint: /api/checkout/pay
method: POST
region: ap-northeast-2

Actions:
[→ View Trace] [Copy Log ID] [Share] [Archive]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 3️⃣ Traces 페이지로 자동 이동
```
User clicks "[→ View Trace]" 또는 직접 traceId 클릭

Auto-navigate to:
URL: /traces?traceId=trace-001-001

(↑ 상단 "Flow 1" 에서 본 Traces 페이지와 동일)
```

**관련 데이터 (public/data/logs-example.json)**
```json
{
  "id": "log-001",
  "timestamp": "2026-03-02T10:30:21.123Z",
  "service": "checkout",
  "level": "ERROR",
  "message": "Payment provider timeout after 3 retries",
  "metadata": {
    "userId": "user-12345",
    "requestId": "req-abc123def456",
    "traceId": "trace-001-001",        // ← 가장 중요
    "spanId": "span-001-002"
  },
  "tags": {
    "endpoint": "/api/checkout/pay"
  }
}
```

#### 4️⃣ Trace 분석
```
Trace ID: trace-001-001
Status: 200 OK (but SLOW)
Duration: 520ms

Waterfall Visualization:
───────────────────────────────────────────

0          100        200        300        400        500
│    │    │    │    │    │    │    │    │    │    │    │
web-request (api-gateway) ──────────────────────────────┐
                              │                           │
validate-cart ───┤           │                           │
                   fetch-inventory ────────────┤          │
                     │                          │         │
                     redis-get ───┤            │         │
                                  db-query ───────┤     │
                                                   │     │
                                    charge-payment ──────┤
                                      call-stripe ────┤
                                                       │
                                       send-confirmation┤

Issue Detection:
⚠️ call-stripe (44% of total time)
⚠️ db-query (27% of total time)

Recommendation from AI:
"Both external API latency and database query efficiency need optimization."
```

---

## 🔄 데이터 흐름 다이어그램

```
┌──────────────────────────────────────────────────────────────┐
│                    Observability Platform                     │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Metrics       Logs         Traces        Dashboards  Alerts  │
│    ↓            ↓             ↓               ↓           ↓    │
│  [KPI]      [LogEntry]   [Span Tree]    [Widget]  [Alert Rule]
│    │            │             │               │           │    │
│    └────────────┴─────────────┴───────────────┴───────────┘    │
│                           │                                     │
│                    AI Assistant                                 │
│                    (Context Aware)                              │
│                           │                                     │
│                 ┌──────────┴──────────┐                         │
│                 │                     │                         │
│            Slack/Email/PagerDuty   User Actions                │
│            (Alert Notif)           (Navigate, Drill-down)      │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 JSON 데이터 구조 요약

모든 JSON 파일은 `/public/data/` 에 위치:

| 파일 | 용도 | 관련 흐름 |
|------|------|---------|
| `logs-example.json` | 로그 데이터 + metadata (traceId, requestId) | Flow 1, 3 |
| `metrics-example.json` | 시계열 메트릭 (error_rate, latency, throughput) | Flow 1, 2 |
| `trace-example.json` | 스팬 워터폴 + 병목 분석 | Flow 1, 3 |
| `dashboards-example.json` | 대시보드 정의 + 위젯 설정 | Flow 2 |
| `alerts-example.json` | 알림 규칙 + 발생 이벤트 | Flow 2 |

---

## 🔧 구현 가이드

### 컴포넌트별 필요 데이터

```
📊 Overview Page
├─ mockMetrics[] (KPI Card 용)
├─ mockServices[] (Service Health 테이블)
├─ mockLogs[] (Recent Logs 테이블)
└─ mockAlertEvents[] (Recent Alerts 섹션)

📝 Logs Page
├─ mockLogs[] (Table)
├─ GlobalFilterState (service, level, timeRange)
└─ Log Detail Drawer 
    └─ metadata.traceId (→ Traces link)

🔍 Traces Page
├─ mockTraces[] (Trace list or detail)
├─ Waterfall visualization
└─ Bottleneck analysis

🔔 Alerts Page
├─ mockAlerts[] (Alert rules list)
└─ mockAlertEvents[] (Firing/Resolved events)

💬 AI Chat Drawer
├─ mockAiMessages[] (Initial conversation)
├─ GlobalFilterState (context injection)
└─ Action links (view_logs, view_traces, create_alert)
```

---

## ✅ 검증 체크리스트

- [ ] Flow 1: Error → AI Analysis → Logs → Trace로 이동 가능
- [ ] Flow 2: Metric 이상 → Alert 생성 → Slack 연결 가능
- [ ] Flow 3: Log에서 traceId 클릭 → Trace 페이지 자동 이동
- [ ] AI Chat에서 컨텍스트 자동 감지 (service, timeRange)
- [ ] 모든 링크([→ View Trace] 등)가 올바르게 작동
- [ ] JSON 데이터가 각 페이지에서 올바르게 렌더링됨
