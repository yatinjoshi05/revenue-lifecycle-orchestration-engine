export type RloeRoute = 'sales_priority' | 'needs_review' | 'disqualified';

export type ChurnRiskLevel = 'low' | 'medium' | 'high';

/**
 * Canonical Table: inbound_intent_log
 * Records inbound signals arriving via Webhook Inbound Gate or PLG Usage Poller.
 */
export interface InboundIntentLog {
  id: string;
  created_at?: string;
  visitor_anonymous_id?: string | null;
  ip_address?: string | null;
  intent_source?: string | null;
  target_url?: string | null;
  company_domain: string;
  company_name?: string | null;
  company_size_range?: string | null;
  estimated_annual_revenue?: number | null;
  industry?: string | null;
  tech_stack_detected?: string[] | null;
  icp_fit_score?: number | null;
  intent_strength_score?: number | null;
  hubspot_deal_id?: string | null;
  routing_status?: string | null;
  execution_id?: string | null;
  estimated_token_cost?: number | null;
  system_error_log?: string | null;
  prefilter_score?: number | null;
  source: string;
  last_source?: string | null;
  route?: string | null;
  churn_risk_level?: string | null;
  first_seen_at?: string | null;
  last_seen_at?: string | null;
  enrichment_summary?: string | null;
  page_url?: string | null;
  utm_source?: string | null;
  utm_campaign?: string | null;
  signals?: Record<string, any> | null;
  received_at?: string;
  workflow_id?: string | null;
  t_start?: string | null;
  cache_hit?: boolean | null;
}

/**
 * Canonical Table: rloe_telemetry
 * Records end-to-end execution, enrichment, scoring, and routing telemetry.
 */
export interface RloeTelemetry {
  id: string;
  company_domain: string;
  source: string;
  stage?: string; // 'ingestion' | 'cache_check' | 'prefilter' | 'claude_routing' | 'crm_sync'
  outcome?: string; // 'routed_to_sales' | 'held_for_review' | 'dropped_disqualified' | 'cache_returned'
  route: RloeRoute;
  cache_hit: boolean;
  prefilter_score: number | null; // Deterministic prefilter score (0-100)
  llm_called: boolean;
  llm_model?: string | null; // e.g. 'claude-3-5-sonnet-20241022' | 'nvidia/llama-3.1-70b'
  input_tokens?: number | null;
  output_tokens?: number | null;
  est_cost_usd?: number | null;
  latency_ms?: number | null;
  processing_ms?: number | null;
  enrichment_wait_ms?: number | null;
  total_ms?: number | null;
  error_message?: string | null;
  
  // AI and firmographic scoring model fields
  icp_fit_score?: number | null; // 0-100
  intent_strength_score?: number | null; // 0-100
  calculated_churn_risk_level?: ChurnRiskLevel | null;
  reasoning_summary?: string | null;
  
  created_at: string;
}

/**
 * Canonical Table: system_error_log
 * Captures node failures, workflow errors, and Claude/LLM call exceptions.
 */
export interface SystemErrorLog {
  id: string;
  execution_id: string;
  workflow_id: string;
  node_name: string;
  error_message: string;
  error_stack?: string | null;
  payload?: Record<string, any> | null;
  created_at: string;
}

/**
 * Calculated RLOE GTM Metrics
 */
export interface RloeMetrics {
  totalSignalsIngested: number;
  cacheTriageResolutionRate: number; // percentage (0-100) or null if 0 denominator
  estimatedPipelineVelocity: number; // sales_priority count * $85,000 USD
  salesPriorityCount: number;
  needsReviewCount: number;
  disqualifiedCount: number;
  llmTokenSpendUSD: number;
  averageLatencyMs: number | null;
  isConnected: boolean;
  lastUpdated: string | null;
}
