# RLOE Comprehensive Pipeline Map & Architecture Specification

**Project:** Revenue Lifecycle Orchestration Engine (RLOE)  
**Repository:** `https://github.com/yatinjoshi05/revenue-lifecycle-orchestration-engine`  
**Workspace:** `D:\gtm`  
**Date:** October 13, 2026  

---

## 1. System Overview

The Revenue Lifecycle Orchestration Engine (RLOE) automates the transition from raw top-of-funnel inbound signals to qualified CRM pipeline deals. It is designed around a **4-Lane Orchestration Architecture** coordinated by n8n, backed by Supabase PostgreSQL canonical stores, and surfaced through a dark slate, glassmorphism CRM dashboard.

```
[ Inbound Signals: Webhook / PLG Cron ]
                   │
                   ▼
       ┌──────────────────────┐
       │ LANE A: Ingestion    │ ─── Validates domain, filters public emails
       └──────────────────────┘
                   │
                   ▼
       ┌──────────────────────┐
       │ LANE B: Cache Triage │ ─── Queries Supabase inbound_intent_log
       └──────────────────────┘     ├── Cache Hit  ──► Routes to Existing Lead Task (Bypasses LLM)
                   │                └── Cache Miss ──► Continues to Lane C
                   ▼
       ┌──────────────────────┐
       │ LANE C: Enrichment   │ ─── Clay Waterfall + Deterministic Prefilter
       │         & AI Routing │ ─── Claude / NVIDIA Nemotron ICP Scoring
       └──────────────────────┘
                   │
                   ▼
       ┌──────────────────────┐
       │ LANE D: CRM & Telemetry│ ── Writes rloe_telemetry, syncs HubSpot
       └──────────────────────┘
                   │
                   ▼
       [ Supabase Canonical REST API ]
                   │
                   ▼
       [ Service Layer: src/services/rloe.ts ]
                   │
                   ▼
       [ Normalization: src/utils/pipelineAdapter.ts ]
                   │
                   ▼
       [ React Contexts: RloeContext & DataContext ]
                   │
                   ▼
       [ CRM Pages: Opportunities, Accounts, Tasks, Telemetry ]
```

---

## 2. Orchestration Lanes (n8n Workflow `99MNkuUquGSPlxXW`)

### Lane A — Signal Ingestion & Gatekeeping
* **Trigger Nodes:**
  1. `Webhook - Inbound Intent Gate`: Production endpoint `/webhook/v1/revenue-lifecycle-orchestrator`.
  2. `Schedule - 15m PLG Poller`: Cron trigger querying `product_usage_log` for account expansion.
* **Processing:**
  - `Payload Verification Parser`: Strips invalid schemas, normalizes domains (`example.com`), rejects disposable/personal email domains (`gmail.com`, `yahoo.com`, `hotmail.com`).
  - Idempotency key generation: `visitor_anonymous_id` and timestamp correlation.

### Lane B — Cache-First Routing Triage
* **Cache Node:** `Supabase - Check Domain Cache`
* **Query:** `SELECT * FROM inbound_intent_log WHERE company_domain = $domain LIMIT 1`
* **Decision Gate:** `Switch - Cache Decision`
  - **Branch 1 (Cache Hit):** The company domain was enriched within the cache TTL window. Bypasses Clay enrichment and LLM scoring entirely, preventing redundant token and API costs.
  - **Action:** Increments signal frequency, updates `last_seen_at`, records `cache_hit: true`, and assigns an operational follow-up task.
  - **Branch 2 (Cache Miss):** Proceed to Lane C for full waterfall enrichment.

### Lane C — Firmographic Enrichment & AI Qualification
* **Enrichment Node:** `Clay - HTTP Waterfall Enrichment`
  - Fetches company firmographics: headcount, verified industry, detected tech stack, funding stage.
* **Deterministic Prefilter Node:** `Code - Prefilter Qualification`
  - Rejects companies with headcount < 10 or non-target industries before invoking expensive model APIs.
  - Score threshold: 0–100.
* **AI Router Node:** `Claude / NVIDIA Nemotron GTM Router`
  - Evaluates firmographic profile, detected pain points, and intent source.
  - Outputs structured scoring: `icp_fit_score` (0–100), `intent_strength_score` (0–100), and `assigned_route` (`sales_priority` | `needs_review` | `disqualified`).

### Lane D — CRM Sync & Operational Telemetry
* **Database Writes:**
  - `Supabase - Insert/Update inbound_intent_log`
  - `Supabase - Insert rloe_telemetry`: Captures latency, token counts, cost estimate, and route outcome.
  - `Supabase - Error Interceptor`: Captures unhandled node exceptions into `system_error_log`.
* **CRM Synchronization:**
  - `HubSpot - Sync Qualified Deal`: Creates or updates deals for `sales_priority` leads.
  - `Slack - Priority Alert`: Triggers instant notification for ICP >= 90 leads.

---

## 3. Database Schema & Row-Level Security (RLS)

Canonical database entities in Supabase PostgreSQL:

### 1. `inbound_intent_log` (12 live records)
* **Purpose:** Authoritative log of inbound signals and enrichment results.
* **Key Columns:** `id` (UUID), `company_domain` (TEXT), `company_name` (TEXT), `source` (TEXT), `route` (TEXT), `routing_status` (TEXT), `icp_fit_score` (INT), `intent_strength_score` (INT), `prefilter_score` (INT), `enrichment_summary` (JSONB), `estimated_annual_revenue` (NUMERIC), `hubspot_deal_id` (TEXT), `created_at` (TIMESTAMPTZ).
* **RLS Policies:**
  - `service_role_full_access_inbound`: Full CRUD for n8n backend.
  - `authenticated_team_read_inbound`: `SELECT` enabled for authenticated users (`TO authenticated USING (true)`).
  - Public `anon`: Restricted (returns `[]` under RLS).

### 2. `rloe_telemetry` (16 live records)
* **Purpose:** Granular execution telemetry, latency, token spend, and cache hits.
* **Key Columns:** `id` (BIGINT), `execution_id` (TEXT), `company_domain` (TEXT), `stage` (TEXT), `outcome` (TEXT), `route` (TEXT), `cache_hit` (BOOLEAN), `llm_called` (BOOLEAN), `total_ms` (INT), `est_cost_usd` (NUMERIC), `created_at` (TIMESTAMPTZ).
* **RLS Policies:** Restricted to `service_role` in live database.

### 3. `system_error_log` (20 live records)
* **Purpose:** Audit trail of node failures, payload errors, and timeouts.
* **Key Columns:** `id` (BIGINT), `execution_id` (TEXT), `node_name` (TEXT), `error_message` (TEXT), `severity` (TEXT), `created_at` (TIMESTAMPTZ).

### 4. `product_usage_log` (0 live records)
* **Purpose:** PLG account activity and telemetry polled every 15 minutes.

---

## 4. Frontend Data Pipeline & Transformation Path

```
Supabase PostgREST
       │
       ▼
src/services/rloe.ts (fetchInboundIntentLogs, fetchRloeTelemetry)
       ├── Injects Bearer token from sessionStorage (if authenticated)
       └── Handles HTTP 401/403 and empty results honestly
       │
       ▼
src/context/RloeContext.tsx
       ├── Holds raw inboundLogs, telemetry, errorLogs
       └── Computes real metrics (Total Signals, Cache Rate, Qualified Count)
       │
       ▼
src/utils/pipelineAdapter.ts
       ├── deriveAccountsFromInboundLogs(): Generates Account records with true revenue & headcount
       ├── deriveOpportunitiesFromInboundLogs(): Maps sales_priority/needs_review to Opportunity records ($0 if unvalued)
       ├── deriveTasksFromInboundLogs(): Generates actionable follow-up tasks for cache hits and priority leads
       └── deriveContactsFromAccounts(): Returns [] (zero fabricated personas)
       │
       ▼
src/context/DataContext.tsx
       ├── Combines derived records with local user state
       └── Exposes CRUD operations for Opportunities, Accounts, Tasks
       │
       ▼
CRM Pages & Components
       ├── UpNextPage (Home Workspace)
       ├── OpportunitiesPage (Board & Table views)
       ├── AccountsPage (Firmographic overview)
       ├── ContactsPage (Clean empty state)
       ├── TasksPage (Action items)
       └── TelemetryPage (RLOE Observability & Inbound Logs)
```
