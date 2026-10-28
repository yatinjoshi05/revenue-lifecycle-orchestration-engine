# RLOE Architecture Evidence Manifest
**Repository:** [yatinjoshi05/revenue-lifecycle-orchestration-engine](https://github.com/yatinjoshi05/revenue-lifecycle-orchestration-engine)  
**Pinned Revision:** `1db74576e8ad8ad495a4345af824eff5777387bc`  
**Tooling:** Archify 3.2.0 (`@tt-a1i/archify`)  
**Generated:** 2026-10-28  

---

## 1. Executive Summary & Forensic Discovery

Every architecture diagram in this portfolio is grounded in the physical codebase of the Revenue Lifecycle Orchestration Engine (RLOE). No components, API endpoints, database schemas, queues, or AI integrations were invented.

### Evidence Classification Framework
- **VERIFIED:** Directly implemented and verified in source code, workflows, or schemas.
- **DOCUMENTED:** Described in technical design documentation and corroborated by runtime scripts.
- **INFERRED:** Logical interpretation clearly qualified as such.
- **PLANNED:** Explicitly designated as planned future capability (none shown as active production elements).

---

## 2. Diagram-by-Diagram Evidence Ledger

### 1. Master System Topology (`rloe-master.html`)
- **Operator Dashboard UI:**
  - `src/App.tsx:L1-50` — React 18 SPA main layout and route registration.
  - `src/services/rloe.ts:L1-60` — REST client connecting to Supabase and n8n webhooks.
- **Webhook Inbound Gate:**
  - `n8n_live_workflow.json:L2-35` — `Webhook Inbound Gate` node (`n8n-nodes-base.webhook`), HTTP POST endpoint.
- **Payload Verification:**
  - `n8n_live_workflow.json:L150-195` — `Payload Verification Parser` code node performing RFC-1035 domain normalization and UTM extraction.
- **PLG Usage Poller:**
  - `n8n_live_workflow.json:L40-85` — `PLG Usage Poller (every 15 min)` cron trigger.
- **Cache Guard & Lock:**
  - `n8n_live_workflow.json:L220-280` — `Supabase Cache Check` and `Is Lead New?` decision node.
  - `n8n_live_workflow.json:L285-320` — `Log Pending Row (Cache Guard)` preventing race-condition duplicate waterfalls.
- **Deterministic Pre-Filter:**
  - `n8n_live_workflow.json:L450-510` — `Deterministic Pre-Filter & Pre-Score` calculating 0–100 firmographic score.
- **Claude GTM Router:**
  - `n8n_live_workflow.json:L540-610` — `Claude GTM Router` HTTP request node calling Anthropic Claude 3.5 Sonnet / Nemotron.
- **Routing Engine:**
  - `n8n_live_workflow.json:L670-730` — `Routing Decision & Telemetry` node categorizing accounts into `sales_priority`, `needs_review`, `disqualified`.
- **HubSpot CRM Sync:**
  - `n8n_live_workflow.json:L750-820` — `HubSpot CRM Sync` node pushing qualified deals and contacts.
- **Supabase Canonical Tables:**
  - `supabase_schema.sql:L14-50` — `inbound_intent_log` with index on `company_domain`.
  - `supabase_schema.sql:L55-70` — `product_usage_log`.
  - `supabase_schema.sql:L75-101` — `rloe_telemetry` tracking input/output tokens, execution latency, and dollar cost.
  - `supabase_schema.sql:L106-121` — `system_error_log` for node and LLM exceptions.

---

### 2. Revenue Lifecycle Workflow (`rloe-workflow.html`)
- **Signal Intake Lane:**
  - Webhook Inbound Gate (`n8n_live_workflow.json:L2-35`)
  - PLG Usage Poller (`n8n_live_workflow.json:L40-85`)
  - Payload Verification (`n8n_live_workflow.json:L150-195`)
- **Cache Guard & State Lane:**
  - Supabase Cache Check (`n8n_live_workflow.json:L200-245`)
  - Is Lead New? (`n8n_live_workflow.json:L250-280`)
  - Log Pending Row (`n8n_live_workflow.json:L285-320`)
- **Enrichment & AI Reasoning Lanes:**
  - Trigger Clay Waterfall (`n8n_live_workflow.json:L325-365`)
  - Deterministic Pre-Filter (`n8n_live_workflow.json:L450-510`)
  - Claude GTM Router (`n8n_live_workflow.json:L550-610`)
- **RevOps Action & Telemetry Lanes:**
  - HubSpot Task: Returning (`n8n_live_workflow.json:L420-450`)
  - HubSpot CRM Sync (`n8n_live_workflow.json:L750-820`)
  - Insert Telemetry (`n8n_live_workflow.json:L830-870`)

---

### 3. Dataflow & Telemetry Pipeline (`rloe-dataflow.html`)
- **Ingress Sources:** Webhook signal payload, PLG usage batch events.
- **Ingestion & Validation:** RFC-1035 domain normalization and account usage mapping.
- **Cache Guard:** `inbound_intent_log` deduplication lookup and pending lock insertion.
- **Dual-Gate AI:** Clay waterfall firmographics callback and gated Claude 3.5 Sonnet invocation.
- **RevOps & Telemetry:** Priority deal creation in HubSpot CRM and execution audit logging in `rloe_telemetry`.

---

### 4. End-to-End Sequence (`rloe-sequence.html`)
- Traced execution path:
  1. `POST /inbound-intent` webhook received from visitor.
  2. Cache query against `inbound_intent_log` by `company_domain`.
  3. Cache miss confirmed; pending row inserted with mutex lock.
  4. Clay waterfall enrichment triggered asynchronously.
  5. Callback received; deterministic pre-filter calculates score = 85 (>= 50 threshold met).
  6. Claude 3.5 Sonnet invoked with firmographic context.
  7. Claude returns `tier: "sales_priority"`, `icp_score: 92`.
  8. HubSpot CRM creates deal and contact (`deal_id: 981240`).
  9. Supabase updates lead record and commits execution telemetry.

---

### 5. Revenue Intent Lifecycle (`rloe-lifecycle.html`)
- Validated state transitions:
  - `Ingress` → `Check` (normalizing domain)
  - `Check` → `Enrich` (cache miss, lock reserved)
  - `Check` → `Returning` (cache hit, CRM task touch)
  - `Enrich` → `Filter` (Clay callback returned)
  - `Filter` → `Scoring` (score >= 50, LLM invoked)
  - `Filter` → `Disqualified` (score < 50, nurture path)
  - `Scoring` → `Priority` (high ICP match, HubSpot deal synced)
  - `Scoring` → `Review` (medium score, human queue)
  - `Scoring` → `Fallback` (API timeout error, safe degradation)
  - `Fallback` → `Review` (transferred to operator queue)
  - `Review` → `Priority` (operator approval in dashboard)
