/**
 * Centralized Typed API Client for NEXUS GTM Control Plane Backend
 * Connects directly to Node/Express backend endpoints.
 * Employs timeouts, correlation IDs, idempotency handling, and zero mock fallbacks.
 */

import {
  Account,
  Contact,
  Opportunity,
  Task,
  RecordList,
} from '../types/crm';

const DEFAULT_TIMEOUT_MS = 10000;

export interface OperationalMetrics {
  timestamp: string;
  uptimeSeconds: number;
  events: {
    totalIngested: number;
    processed: number;
    duplicatesSuppressed: number;
    failed: number;
  };
  signals: {
    totalDetected: number;
    byType: Record<string, number>;
  };
  handoffs: {
    totalCreated: number;
    byStatus: Record<string, number>;
    avgFirstResponseMinutes: number | null;
    slaCompliancePercentage: number;
  };
  integrity: {
    openIssues: number;
    resolvedIssues: number;
    rejectedIssues: number;
    proposedActions: number;
    approvedActions: number;
  };
}

export interface LifecycleSignal {
  id: string;
  account_id: string;
  domain?: string;
  signal_type: string;
  confidence_score: number;
  source_event_id: string | null;
  severity: 'critical' | 'warning' | 'info';
  metadata: Record<string, any>;
  created_at: string;
}

export interface GtmHandoff {
  id: string;
  account_id: string;
  domain?: string;
  signal_id: string | null;
  target_role: string;
  assigned_owner_id: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'escalated' | 'failed';
  sla_deadline: string;
  first_responded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntegrityIssue {
  id: string;
  rule_id: string;
  rule_name?: string;
  entity_type: string;
  entity_id: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'detected' | 'in_review' | 'action_proposed' | 'approved' | 'rejected' | 'resolved' | string;
  evidence: Record<string, any>;
  detected_at: string;
  resolved_at: string | null;
  proposed_action_id?: string | null;
  action_type?: string | null;
  action_status?: string | null;
}

export interface ProposedAction {
  id: string;
  issue_id: string;
  action_type: string;
  target_entity: string;
  target_id: string;
  payload: Record<string, any>;
  status: 'proposed' | 'approved' | 'rejected' | 'executed' | 'failed';
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface Account360 {
  account: {
    id: string;
    domain: string;
    name: string;
    lifecycle_stage: string;
    tier: string;
    health_score: number;
    created_at: string;
    updated_at: string;
    metadata?: Record<string, any>;
  };
  events: Array<{
    id: string;
    event_name: string;
    processing_status: string;
    created_at: string;
    properties: Record<string, any>;
  }>;
  signals: LifecycleSignal[];
  activeHandoffs: GtmHandoff[];
  integrityIssues: IntegrityIssue[];
  auditTrail: Array<{
    id: string;
    action: string;
    actor: string;
    details: Record<string, any>;
    timestamp: string;
  }>;
}

export interface EnrichmentJob {
  id: string;
  domain: string;
  status: 'pending' | 'submitted' | 'completed' | 'failed' | 'timed_out';
  provider_request_id?: string;
  created_at: string;
  completed_at: string | null;
  error_message?: string;
  result_payload?: Record<string, any>;
}

export interface SystemMeta {
  version: string;
  environment: string;
  uptime: number;
  database: {
    provider: string;
    status: string;
  };
  activeModules: {
    signals: string;
    enrichment: string;
    handoffs_sla: string;
    revenue_integrity: string;
    observability: string;
  };
}

export interface FailedOperations {
  failedHandoffs: Array<{
    id: string;
    account_id: string;
    target_role: string;
    assigned_owner_id: string;
    error_details: any;
    created_at: string;
  }>;
  failedActionAttempts: Array<{
    id: string;
    action_type?: string;
    target_id?: string;
    error_message?: string;
    executed_at?: string;
  }>;
  criticalIssues: IntegrityIssue[];
}

export interface ReconcileResult {
  message: string;
  report: {
    escalatedCount: number;
    recoveredCount: number;
    timedOutJobsCount: number;
    unroutedCount: number;
    integrityCount: number;
    timestamp: string;
  };
}

class NexusApiClient {
  private operatorToken: string | null = null;

  public setOperatorToken(token: string | null): void {
    this.operatorToken = token ? token.trim() : null;
    if (typeof sessionStorage !== 'undefined') {
      if (this.operatorToken) {
        sessionStorage.setItem('nexus_operator_bearer_token', this.operatorToken);
      } else {
        sessionStorage.removeItem('nexus_operator_bearer_token');
      }
    }
  }

  public clearOperatorToken(): void {
    this.setOperatorToken(null);
  }

  public getOperatorToken(): string | null {
    if (this.operatorToken) return this.operatorToken;
    if (typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem('nexus_operator_bearer_token');
      if (stored) {
        this.operatorToken = stored;
        return stored;
      }
    }
    return null;
  }

  private customBaseUrl: string | null = null;

  public setBaseUrl(url: string | null): void {
    this.customBaseUrl = url ? url.replace(/\/+$/, '') : null;
  }

  private getBaseUrl(): string {
    if (this.customBaseUrl) return this.customBaseUrl;
    return (
      (import.meta as any).env?.VITE_NEXUS_API_URL ||
      (import.meta as any).env?.VITE_API_BASE_URL ||
      '/api/v1'
    );
  }

  private getApiKey(): string | null {
    return (import.meta as any).env?.VITE_NEXUS_API_KEY || null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    customHeaders: Record<string, string> = {}
  ): Promise<T> {
    const baseUrl = this.getBaseUrl();
    const url = endpoint.startsWith('http')
      ? endpoint
      : endpoint.startsWith('/api') || endpoint.startsWith('/health') || endpoint.startsWith('/ready')
      ? endpoint
      : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const requestId = crypto.randomUUID ? crypto.randomUUID() : `req_${Date.now()}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-request-id': requestId,
      ...customHeaders,
    };

    const operatorToken = this.getOperatorToken();
    if (operatorToken) {
      headers['Authorization'] = `Bearer ${operatorToken}`;
    } else {
      const apiKey = this.getApiKey();
      if (apiKey) {
        headers['x-nexus-api-key'] = apiKey;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...(options.headers as Record<string, string> || {}),
        },
        signal: controller.signal,
      });

      const text = await res.text();
      let data: any;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { raw: text };
      }

      if (!res.ok) {
        const errorMsg = data?.error || data?.message || `Request failed with HTTP ${res.status}`;
        const err = new Error(errorMsg) as any;
        err.status = res.status;
        err.code = data?.code || `HTTP_${res.status}`;
        err.data = data;
        throw err;
      }

      return data as T;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        const timeoutErr = new Error(`Request to ${endpoint} timed out after ${DEFAULT_TIMEOUT_MS / 1000}s`) as any;
        timeoutErr.code = 'TIMEOUT';
        throw timeoutErr;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // 1. Health & Meta
  async getHealth(): Promise<{ status: string; uptime: number; timestamp: string }> {
    const baseUrl = this.getBaseUrl();
    const rootUrl = baseUrl.replace(/\/api\/v1\/?$/, '');
    return this.request<{ status: string; uptime: number; timestamp: string }>(`${rootUrl}/health`);
  }

  async getReady(): Promise<{ status: string; database: string }> {
    const baseUrl = this.getBaseUrl();
    const rootUrl = baseUrl.replace(/\/api\/v1\/?$/, '');
    return this.request<{ status: string; database: string }>(`${rootUrl}/ready`);
  }

  async getMeta(): Promise<SystemMeta> {
    return this.request<SystemMeta>('/meta');
  }

  // 2. Metrics & Telemetry
  async getMetrics(): Promise<OperationalMetrics> {
    return this.request<OperationalMetrics>('/metrics');
  }

  // 3. Signals & Events
  async getSignals(params?: { type?: string; severity?: string; domain?: string; limit?: number }): Promise<LifecycleSignal[]> {
    const search = new URLSearchParams();
    if (params?.type && params.type !== 'all') {
      search.set('signalType', params.type);
    }
    if (params?.severity) search.set('severity', params.severity);
    if (params?.domain) search.set('domain', params.domain);
    if (params?.limit) search.set('limit', String(params.limit));
    const query = search.toString() ? `?${search.toString()}` : '';
    const res = await this.request<{ signals?: LifecycleSignal[] } | LifecycleSignal[]>(`/signals${query}`);
    return Array.isArray(res) ? res : (res.signals || []);
  }

  async ingestEvent(payload: {
    idempotencyKey: string;
    domain?: string;
    accountDomain?: string;
    eventName: string;
    properties?: Record<string, any>;
    payload?: Record<string, any>;
    accountName?: string;
  }): Promise<{ eventId: string; status: string; signalsCount: number; newLifecycleStage?: string }> {
    const formatted = {
      idempotencyKey: payload.idempotencyKey,
      accountDomain: payload.accountDomain || payload.domain || '',
      eventName: payload.eventName,
      payload: payload.payload || payload.properties || {},
      ...(payload.accountName ? { accountName: payload.accountName } : {}),
    };
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(formatted),
    }, {
      'Idempotency-Key': payload.idempotencyKey,
    });
  }

  async batchIngestEvents(events: Array<{
    idempotencyKey: string;
    domain?: string;
    accountDomain?: string;
    eventName: string;
    properties?: Record<string, any>;
    payload?: Record<string, any>;
    accountName?: string;
  }>): Promise<{ ingestedCount: number; results: any[] }> {
    const formattedEvents = events.map(evt => ({
      idempotencyKey: evt.idempotencyKey,
      accountDomain: evt.accountDomain || evt.domain || '',
      eventName: evt.eventName,
      payload: evt.payload || evt.properties || {},
      ...(evt.accountName ? { accountName: evt.accountName } : {}),
    }));
    return this.request('/events/batch', {
      method: 'POST',
      body: JSON.stringify({ events: formattedEvents }),
    });
  }

  async getAccountTimeline(domain: string): Promise<{
    domain: string;
    events: any[];
    signals: LifecycleSignal[];
  }> {
    return this.request(`/accounts/${encodeURIComponent(domain)}/timeline`);
  }

  // 4. Unified Account 360
  async getAccount360(domain: string): Promise<Account360> {
    return this.request<Account360>(`/accounts/${encodeURIComponent(domain)}/360`);
  }

  // 5. GTM Handoffs & SLA
  async getHandoffs(params?: { status?: string; targetRole?: string; limit?: number }): Promise<GtmHandoff[]> {
    const search = new URLSearchParams();
    if (params?.status && params.status !== 'all') search.set('status', params.status);
    if (params?.targetRole) search.set('targetRole', params.targetRole);
    if (params?.limit) search.set('limit', String(params.limit));
    const query = search.toString() ? `?${search.toString()}` : '';
    const res = await this.request<{ handoffs?: GtmHandoff[] } | GtmHandoff[]>(`/handoffs${query}`);
    return Array.isArray(res) ? res : (res.handoffs || []);
  }

  async transitionHandoff(
    id: string,
    toStatus: string,
    actor = 'nexus_operator',
    reason = 'Operator status transition'
  ): Promise<GtmHandoff> {
    const res = await this.request<any>(`/handoffs/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: toStatus, actor, reason }),
    });
    return res?.handoff || res;
  }

  async recordFirstResponse(id: string): Promise<{ handoff: GtmHandoff }> {
    return this.request(`/handoffs/${encodeURIComponent(id)}/first-response`, {
      method: 'POST',
    });
  }

  async evaluateSlaBreaches(): Promise<{ escalatedCount: number }> {
    return this.request('/handoffs/evaluate-sla', {
      method: 'POST',
    });
  }

  // 6. Revenue Integrity & Approvals
  async getIssues(params?: { status?: string; ruleId?: string }): Promise<IntegrityIssue[]> {
    const search = new URLSearchParams();
    if (params?.status) search.set('status', params.status);
    if (params?.ruleId) search.set('ruleId', params.ruleId);
    const query = search.toString() ? `?${search.toString()}` : '';
    const res = await this.request<{ issues?: IntegrityIssue[] } | IntegrityIssue[]>(`/issues${query}`);
    return Array.isArray(res) ? res : (res.issues || []);
  }

  async approveAction(actionId: string, approvedBy: string): Promise<{
    action: ProposedAction;
    decisionToken: string;
  }> {
    return this.request(`/actions/${encodeURIComponent(actionId)}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approvedBy }),
    });
  }

  async rejectAction(actionId: string, rejectedBy: string, reason: string): Promise<{ action: ProposedAction }> {
    return this.request(`/actions/${encodeURIComponent(actionId)}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectedBy, reason }),
    });
  }

  async executeAction(actionId: string, decisionToken: string): Promise<{
    success: boolean;
    action: ProposedAction;
    issueStatus: string;
  }> {
    return this.request(`/actions/${encodeURIComponent(actionId)}/execute`, {
      method: 'POST',
      body: JSON.stringify({ decisionToken }),
    });
  }

  // 7. Enrichment Operations
  async getEnrichmentJobs(params?: { domain?: string; status?: string }): Promise<EnrichmentJob[]> {
    if (!params?.domain) {
      // Backend requires domain query parameter; return empty list safely if not supplied
      return [];
    }
    const search = new URLSearchParams();
    search.set('domain', params.domain);
    if (params?.status) search.set('status', params.status);
    const query = search.toString() ? `?${search.toString()}` : '';
    const res = await this.request<{ jobs?: EnrichmentJob[] } | EnrichmentJob[]>(`/enrichment/jobs${query}`);
    return Array.isArray(res) ? res : (res.jobs || []);
  }

  async getEnrichmentJob(id: string): Promise<EnrichmentJob> {
    const res = await this.request<{ job?: EnrichmentJob } | EnrichmentJob>(`/enrichment/jobs/${encodeURIComponent(id)}`);
    return (res as any).job || res;
  }

  // 8. Operations & Reconciliation
  async getFailures(): Promise<FailedOperations> {
    return this.request<FailedOperations>('/operations/failures');
  }

  async reconcile(): Promise<ReconcileResult> {
    return this.request<ReconcileResult>('/operations/reconcile', {
      method: 'POST',
    });
  }

  // 9. Leads Pipeline Operations
  async getLeads(params?: { limit?: number; tier?: string }): Promise<LeadRecord[]> {
    const search = new URLSearchParams();
    if (params?.limit) search.set('limit', String(params.limit));
    if (params?.tier) search.set('tier', params.tier);
    const query = search.toString() ? `?${search.toString()}` : '';
    const res = await this.request<{ leads?: LeadRecord[] } | LeadRecord[]>(`/leads${query}`);
    return Array.isArray(res) ? res : (res.leads || []);
  }

  async submitBuyingSignal(signal: {
    company_name: string;
    website?: string;
    buying_signal_detected: string;
    source_url?: string;
    funding_amount?: string;
    series?: string;
  }): Promise<{ success: boolean; lead: LeadRecord }> {
    return this.request('/company-buying-signal', {
      method: 'POST',
      body: JSON.stringify(signal),
    });
  }

  // 10. Shared CRM Persistence Operations
  async getCrmAccounts(): Promise<Account[]> {
    const res = await this.request<any>('/crm/accounts');
    return Array.isArray(res) ? res : (res?.accounts || []);
  }

  async createCrmAccount(account: Partial<Account>): Promise<Account> {
    const res = await this.request<any>('/crm/accounts', {
      method: 'POST',
      body: JSON.stringify(account),
    });
    return res?.account || res;
  }

  async deleteCrmAccount(id: string): Promise<void> {
    await this.request(`/crm/accounts/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  async getCrmContacts(): Promise<Contact[]> {
    const res = await this.request<any>('/crm/contacts');
    return Array.isArray(res) ? res : (res?.contacts || []);
  }

  async createCrmContact(contact: Partial<Contact>): Promise<Contact> {
    const res = await this.request<any>('/crm/contacts', {
      method: 'POST',
      body: JSON.stringify(contact),
    });
    return res?.contact || res;
  }

  async deleteCrmContact(id: string): Promise<void> {
    await this.request(`/crm/contacts/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  async getCrmOpportunities(): Promise<Opportunity[]> {
    const res = await this.request<any>('/crm/opportunities');
    return Array.isArray(res) ? res : (res?.opportunities || []);
  }

  async createCrmOpportunity(opp: Partial<Opportunity>): Promise<Opportunity> {
    const res = await this.request<any>('/crm/opportunities', {
      method: 'POST',
      body: JSON.stringify(opp),
    });
    return res?.opportunity || res;
  }

  async updateCrmOpportunity(id: string, updates: Partial<Opportunity>): Promise<Opportunity> {
    const res = await this.request<any>(`/crm/opportunities/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return res?.opportunity || res;
  }

  async deleteCrmOpportunity(id: string): Promise<void> {
    await this.request(`/crm/opportunities/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  async getCrmTasks(): Promise<Task[]> {
    const res = await this.request<any>('/crm/tasks');
    return Array.isArray(res) ? res : (res?.tasks || []);
  }

  async createCrmTask(task: Partial<Task>): Promise<Task> {
    const res = await this.request<any>('/crm/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
    return res?.task || res;
  }

  async updateCrmTask(id: string, updates: Partial<Task>): Promise<Task> {
    const res = await this.request<any>(`/crm/tasks/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return res?.task || res;
  }

  async deleteCrmTask(id: string): Promise<void> {
    await this.request(`/crm/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  async getCrmLists(): Promise<RecordList[]> {
    const res = await this.request<any>('/crm/lists');
    return Array.isArray(res) ? res : (res?.lists || []);
  }

  async createCrmList(list: Partial<RecordList>): Promise<RecordList> {
    const res = await this.request<any>('/crm/lists', {
      method: 'POST',
      body: JSON.stringify(list),
    });
    return res?.list || res;
  }

  async updateCrmList(id: string, updates: Partial<RecordList>): Promise<RecordList> {
    const res = await this.request<any>(`/crm/lists/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return res?.list || res;
  }

  async deleteCrmList(id: string): Promise<void> {
    await this.request(`/crm/lists/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  async migrateCrmData(payload: {
    accounts?: Account[];
    contacts?: Contact[];
    opportunities?: Opportunity[];
    tasks?: Task[];
    lists?: RecordList[];
  }): Promise<{ success: boolean; imported: any; skipped: any }> {
    return this.request('/crm/migrate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export interface LeadRecord {
  id: string;
  created_at: string;
  company_name: string;
  website: string | null;
  buying_signal_detected: string | null;
  lead_score: number | null;
  lead_tier: string | null;
  ai_research_summary: string | null;
}

export const nexusApi = new NexusApiClient();
