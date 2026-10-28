# Revenue Lifecycle Orchestration Engine (RLOE)

> **Autonomous Inbound Intent Triage, Deduplication & Gated LLM Lead Routing**  
> **Stack:** n8n Workflow Orchestrator, Supabase (PostgreSQL), Clay Waterfall, Anthropic Claude / NVIDIA Nemotron, HubSpot CRM, React 18 / Vite 6 Dashboard

---

## 1. Project Overview & Business Problem

Modern B2B revenue teams face two costly bottlenecks:
1. **Redundant & Costly Enrichment:** Webhook events from website visitors, content downloads, and product-led growth (PLG) usage spikes often trigger uncoordinated, repetitive third-party API calls (e.g. Clay, Clearbit), multiplying data-enrichment costs.
2. **Uncontrolled LLM Token Spend:** Indiscriminately piping every raw event into large language models for scoring burns AI tokens on non-ICP traffic, scrapers, and low-intent visitors.

**RLOE (Revenue Lifecycle Orchestration Engine)** solves this by introducing a dual-gate revenue orchestration architecture:
* **Cache-First Deduplication:** Intercepts signals against Supabase before enrichment, reserving pending rows to prevent race-condition duplicates.
* **Deterministic Pre-Filtering:** Scores accounts against firmographic thresholds (0–100) before gating access to LLM reasoning. Only high-potential accounts invoke LLM qualification.
* **Audited Telemetry & CRM Routing:** Writes end-to-end execution latency, token counts, and costs to telemetry tables while routing qualified accounts directly to HubSpot.

---

## 2. Architecture & Data Flow

```
                                      ┌────────────────────────┐
                                      │ Inbound Webhook Signal │
                                      └───────────┬────────────┘
                                                  │
                                                  ▼
                                      ┌────────────────────────┐
                                      │ Payload Verification   │
                                      │ & Domain Normalization │
                                      └───────────┬────────────┘
                                                  │
                                                  ▼
                                      ┌────────────────────────┐
                                      │ Supabase Cache Check   │
                                      │ (inbound_intent_log)   │
                         ┌────────────────────────┴────────────────────────┐
                         │                                                 │
                   [Cache Hit]                                       [Cache Miss]
                         │                                                 │
                         ▼                                                 ▼
             ┌──────────────────────┐                          ┌──────────────────────┐
             │ Update Last-Seen     │                          │ Log Pending Row      │
             │ Route: CRM Task      │                          │ (Cache Guard Lock)   │
             │ (Bypass AI & Enr.)   │                          └──────────┬───────────┘
             └──────────────────────┘                                     │
                                                                          ▼
                                                               ┌──────────────────────┐
                                                               │ Trigger Clay         │
                                                               │ Enrichment Waterfall │
                                                               └──────────┬───────────┘
                                                                          │
                                                                          ▼
                                                               ┌──────────────────────┐
                                                               │ Clay Callback Gate   │
                                                               └──────────┬───────────┘
                                                                          │
                                                                          ▼
                                                               ┌──────────────────────┐
                                                               │ Deterministic        │
                                                               │ Pre-Score (0-100)    │
                                                               └──────────┬───────────┘
                                                                          │
                                         ┌────────────────────────────────┴────────────────────────────────┐
                                         │                                                                 │
                               [Pre-Score < 35]                                                  [Pre-Score >= 35]
                                         │                                                                 │
                                         ▼                                                                 ▼
                             ┌──────────────────────┐                                          ┌──────────────────────┐
                             │ Disqualify Lead      │                                          │ Invoke Claude Router │
                             │ LLM Bypassed ($0)    │                                          │ (Structured JSON)    │
                             └──────────┬───────────┘                                          └──────────┬───────────┘
                                        │                                                                 │
                                        └─────────────────────────┬───────────────────────────────────────┘
                                                                  ▼
                                                      ┌──────────────────────┐
                                                      │ Update Lead Record & │
                                                      │ Record Telemetry     │
                                                      └──────────┬───────────┘
                                                                  │
                                                                  ▼
                                                      ┌──────────────────────┐
                                                      │ HubSpot Deal/Task    │
                                                      │ Synchronization      │
                                                      └──────────────────────┘
```

---

## 3. Workflow Stages & Deduplication Strategy

### Stage 1: Ingestion & Verification
* **Webhook Inbound Gate:** Ingests raw JSON payloads with shared bearer-token authentication.
* **PLG Usage Poller:** Scheduled cron (every 15 min) querying `product_usage_log` for unhandled weekly active user (WAU) anomalies, seat utilization drops, or feature engagement.
* **Payload Verification Parser:** Validates domains, normalizes URLs, extracts UTM tracking metadata, and generates an execution fingerprint.

### Stage 2: Cache-First Gate & Pending Row Guard
* Queries `inbound_intent_log` by `company_domain`.
* **If domain exists:** Bypasses Clay and LLM stages completely, updates `last_seen_at`, logs a returning-lead task in HubSpot, and records `$0` enrichment telemetry.
* **If domain is new:** Immediately inserts an `enrichment_pending` row with `execution_id` and timestamps. This "Cache Guard" prevents concurrent webhooks for the same domain from initiating parallel enrichment jobs.

### Stage 3: Clay Enrichment Waterfall & Callback
* Fires an async webhook to Clay containing the verified company domain.
* Clay enriches company size, annual revenue range, industry, and detected tech stack.
* The workflow pauses or resumes via the dedicated `Clay Callback Webhook`.

### Stage 4: Deterministic Pre-Filtering & Token Cost Gating
* Before calling any LLM, an algorithmic pre-filter evaluates:
  * Company size range (+20 to +40 pts)
  * Estimated annual revenue (+15 to +30 pts)
  * Target B2B industries (+15 pts)
  * High-value tech stack detected (+15 pts)
* **Threshold Gate (`Worth Spending LLM Tokens?`):** If the score is below 35, the account is disqualified immediately. The LLM is **100% bypassed**, saving LLM token spend.

### Stage 5: Gated LLM Routing (Claude / NVIDIA)
* Qualified leads are sent to the Claude GTM Router with a structured JSON schema.
* Returns `icp_fit_score` (0–100), `intent_strength_score` (0–100), `route` (`sales_priority` | `needs_review` | `disqualified`), and concise reasoning.
* Output parser validates JSON syntax and provides structured fallback on malformed responses.

### Stage 6: CRM Synchronization & Telemetry Logging
* **HubSpot CRM Sync:** Creates Deals for `sales_priority` accounts and assigns follow-up tasks to account executives.
* **Supabase Telemetry:** Inserts execution metrics into `rloe_telemetry` (latency, tokens consumed, estimated cost, cache hit state).

---

## 4. Canonical Supabase Database Tables

The system operates across 4 core tables defined in [supabase_schema.sql](file:///d:/gtm/supabase_schema.sql):

| Table Name | Description | Key Columns |
| :--- | :--- | :--- |
| `inbound_intent_log` | Canonical lead repository and deduplication cache store. | `id`, `company_domain`, `source`, `routing_status`, `route`, `icp_fit_score`, `intent_strength_score`, `prefilter_score`, `first_seen_at`, `last_seen_at` |
| `product_usage_log` | Product-led growth usage events polled on a schedule. | `id`, `company_domain`, `account_id`, `active_users_7d`, `seats_purchased`, `processed`, `created_at` |
| `rloe_telemetry` | Granular operational metrics per execution. | `execution_id`, `company_domain`, `stage`, `outcome`, `route`, `cache_hit`, `llm_called`, `input_tokens`, `output_tokens`, `est_cost_usd`, `latency_ms` |
| `system_error_log` | Error isolation and diagnostic log. | `execution_id`, `workflow_id`, `node_name`, `error_message`, `company_domain`, `severity`, `created_at` |

---

## 5. Integration Prerequisites

To deploy and execute the complete workflow, the following services and accounts are required:
* **n8n Instance:** Cloud-hosted or self-hosted n8n (v1.0+).
* **Supabase:** A PostgreSQL project with database REST API enabled.
* **Clay:** An active account with a webhook-triggered waterfall table configured.
* **LLM Provider:** Anthropic API key (`claude-3-5-sonnet`) or NVIDIA NIM (`meta/llama-3.1-70b-instruct`).
* **HubSpot CRM:** A Private App access token with `crm.objects.deals.write`, `crm.objects.contacts.write`, and `crm.objects.tasks.write` scopes.

---

## 6. Setup & Installation

### Step 1: Database Setup
Execute the canonical schema script in your Supabase SQL Editor:
```sql
-- Run d:/gtm/supabase_schema.sql in Supabase SQL Editor
```

### Step 2: Environment Configuration
Copy the provided `.env.example` template:
```bash
cp .env.example .env.local
```
Fill in your Supabase URL, anon key, and n8n webhook authentication secrets. **Never commit `.env.local` to Git.**

### Step 3: Import n8n Workflow
1. Open your n8n workspace.
2. Select **Workflows > Import from File**.
3. Select `n8n_live_workflow.json` (39 nodes).
4. Configure credential bindings for:
   * **Supabase API:** Add your Supabase Host URL and Service Role Key.
   * **Header Auth:** Set your shared internal `Authorization` secret.
5. Activate the workflow.

### Step 4: Run the GTM Dashboard UI
```bash
# Install dependencies
npm install

# Run the local development server (port 5173)
npm run dev

# Build the production bundle
npm run build
```

---

## 7. Verified Testing & Demonstration Evidence

The repository includes pre-configured PowerShell and Postman test suites to verify each architectural branch:

### Test Scenario 1: High-Score Happy Path (`linear.app`)
* **Execution:** Run `RLOE_DEMO_1_PRACTICE_HIGH_SCORE.ps1`
* **Verified Flow:** Webhook Inbound -> Cache Miss -> Cache Guard Pending Row -> Clay Waterfall -> Pre-Score 95 -> LLM Gate Cleared -> Claude Sales Priority -> HubSpot Deal Created -> Telemetry Inserted.

### Test Scenario 2: Low-Score Cost-Gate Path (`mikesbakerynyc.com`)
* **Execution:** Run `RLOE_DEMO_2_INTERVIEW_LOW_SCORE.ps1`
* **Verified Flow:** Webhook Inbound -> Cache Miss -> Clay Waterfall -> Pre-Score 15 (<35) -> **LLM Cost Gate Bypassed** -> Lead Disqualified -> $0 Token Spend Recorded.

### Test Scenario 3: Deduplication Cache Hit (`retrieval.ai`)
* **Execution:** Run `RLOE_DEMO_3_INTERVIEW_DUPLICATE.ps1`
* **Verified Flow:** Webhook Inbound -> **Cache Hit** (`inbound_intent_log`) -> Clay Waterfall Skipped -> LLM Skipped -> `last_seen_at` Updated -> HubSpot Returning Lead Task Created -> Latency < 100ms.

---

## 8. Operating Scope & Known Constraints

* **Workflow Template vs. Live Cloud Service:** This repository provides the fully functional **workflow configuration artifact (`n8n_live_workflow.json`)**, database schemas, and demo frontend. It is designed to be imported into an active n8n orchestrator. Continuous operation requires an active, hosted n8n runtime and live Supabase PostgreSQL connection.
* **Synchronous Webhook Response:** Standard webhooks acknowledge receipt with an execution ID; full multi-enrichment waterfall completion depends on third-party callback latency.
* **Rate Limits:** Clay and LLM provider quotas apply based on the individual API keys configured in your n8n credentials.
