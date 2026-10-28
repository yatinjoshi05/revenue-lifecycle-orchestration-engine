-- ==============================================================================
-- RLOE (Revenue Lifecycle Orchestration Engine) — Supabase Canonical Schema
-- Derived strictly from verified n8n workflow node configurations and TypeScript models.
-- ==============================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. inbound_intent_log
-- Records inbound intent signals from webhooks and PLG polling.
-- Acts as the cache store to prevent duplicate enrichment waterfalls.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inbound_intent_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_domain TEXT NOT NULL,
    company_name TEXT,
    company_size_range TEXT,
    estimated_annual_revenue NUMERIC,
    industry TEXT,
    tech_stack_detected TEXT[],
    visitor_anonymous_id TEXT,
    ip_address TEXT,
    source TEXT NOT NULL,
    last_source TEXT,
    target_url TEXT,
    page_url TEXT,
    utm_source TEXT,
    utm_campaign TEXT,
    signals JSONB,
    routing_status TEXT, -- e.g., 'enrichment_pending', 'routed', 'needs_review'
    route TEXT,          -- 'sales_priority' | 'needs_review' | 'disqualified'
    icp_fit_score INTEGER,
    intent_strength_score INTEGER,
    prefilter_score INTEGER,
    churn_risk_level TEXT,
    enrichment_summary TEXT,
    hubspot_deal_id TEXT,
    execution_id TEXT,
    workflow_id TEXT,
    cache_hit BOOLEAN,
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for cache check latency optimization (Cache-First Routing)
CREATE INDEX IF NOT EXISTS idx_inbound_intent_domain ON inbound_intent_log(company_domain);
CREATE INDEX IF NOT EXISTS idx_inbound_intent_created ON inbound_intent_log(created_at DESC);

-- ------------------------------------------------------------------------------
-- 2. product_usage_log
-- Stores raw PLG usage events polled every 15 minutes by n8n.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_usage_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id TEXT,
    company_domain TEXT NOT NULL,
    active_users_7d INTEGER DEFAULT 0,
    active_users_prev_7d INTEGER DEFAULT 0,
    last_login_at TIMESTAMPTZ,
    seats_purchased INTEGER DEFAULT 0,
    key_feature_events_7d INTEGER DEFAULT 0,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_usage_unprocessed ON product_usage_log(processed) WHERE processed = FALSE;
CREATE INDEX IF NOT EXISTS idx_product_usage_domain ON product_usage_log(company_domain);

-- ------------------------------------------------------------------------------
-- 3. rloe_telemetry
-- Real-time performance, token consumption, and routing telemetry.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rloe_telemetry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id TEXT,
    workflow_id TEXT,
    company_domain TEXT NOT NULL,
    source TEXT NOT NULL,
    stage TEXT,          -- 'ingestion' | 'cache_check' | 'prefilter' | 'scored' | 'crm_sync'
    outcome TEXT,        -- 'existing_lead_crm_task' | 'routed_to_sales' | etc.
    route TEXT,          -- 'sales_priority' | 'needs_review' | 'disqualified' | 'crm_touch'
    cache_hit BOOLEAN DEFAULT FALSE,
    prefilter_score NUMERIC,
    llm_called BOOLEAN DEFAULT FALSE,
    llm_model TEXT,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    est_cost_usd NUMERIC(10, 6) DEFAULT 0,
    latency_ms INTEGER,
    processing_ms INTEGER,
    enrichment_wait_ms INTEGER DEFAULT 0,
    total_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_created ON rloe_telemetry(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_domain ON rloe_telemetry(company_domain);

-- ------------------------------------------------------------------------------
-- 4. system_error_log
-- Audit log capturing node errors, Claude LLM exceptions, and workflow failures.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_error_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id TEXT,
    workflow_id TEXT,
    node_name TEXT,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    company_domain TEXT,
    source TEXT,
    severity TEXT DEFAULT 'error', -- 'error' | 'critical'
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_log_created ON system_error_log(created_at DESC);

-- ------------------------------------------------------------------------------
-- Row-Level Security (RLS) Configuration — Principle of Least Privilege
-- ------------------------------------------------------------------------------
ALTER TABLE inbound_intent_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE rloe_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_error_log ENABLE ROW LEVEL SECURITY;

-- 1. n8n Orchestrator Access (Full CRUD via Service Role)
-- n8n backend connects using the SUPABASE_SERVICE_ROLE_KEY to perform inserts and updates.
CREATE POLICY "service_role_full_access_inbound" ON inbound_intent_log FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_full_access_usage" ON product_usage_log FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_full_access_telemetry" ON rloe_telemetry FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_full_access_errors" ON system_error_log FOR ALL USING (auth.role() = 'service_role');

-- 2. Dashboard Internal Team Access (Read-Only for Authenticated Users)
-- In production, the GTM dashboard should be restricted to authenticated team members:
CREATE POLICY "authenticated_team_read_inbound" ON inbound_intent_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_team_read_usage" ON product_usage_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_team_read_telemetry" ON rloe_telemetry FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_team_read_errors" ON system_error_log FOR SELECT TO authenticated USING (true);

-- 3. Security Warning: Anonymous Read Policy (Sandbox / Portfolio Demo Only)
-- CAUTION: Do NOT enable public anonymous read policies on live production databases,
-- as inbound_intent_log and system_error_log contain sensitive company domains, visitor identifiers,
-- and system stack traces. If hosting a public portfolio demo against a dedicated sandbox:
--
-- CREATE POLICY "demo_public_read_telemetry" ON rloe_telemetry FOR SELECT TO anon USING (true);
-- CREATE POLICY "demo_public_read_inbound" ON inbound_intent_log FOR SELECT TO anon USING (true);
