# RLOE Frontend Data Audit & Page-by-Page Verification

**Project:** Revenue Lifecycle Orchestration Engine (RLOE)  
**Workspace:** `D:\gtm`  
**Date:** October 13, 2026  

---

## 1. Page Audit Summary

| CRM Page | Authoritative Data Source | Service Function | Transformation Function | Real DB Fields Used | Loading & Empty State Behavior | Fabricated Data Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Home / Up Next** | `inbound_intent_log` & Local CRM state | `fetchInboundIntentLogs()` | `deriveOpportunitiesFromInboundLogs()`, `deriveTasksFromInboundLogs()` | `company_domain`, `route`, `estimated_annual_revenue`, `last_seen_at` | Shows skeleton loaders while fetching; displays 0-count summaries when empty | **ZERO FABRICATION** — Authentic opportunity and task counts |
| **Opportunities** | `inbound_intent_log` | `fetchInboundIntentLogs()` | `deriveOpportunitiesFromInboundLogs()` | `id`, `company_domain`, `company_name`, `route`, `icp_fit_score`, `prefilter_score`, `estimated_annual_revenue` | Empty board columns when no deals exist; loading spinner in toolbar | **ZERO FABRICATION** — Removed $85k multiplier; amounts derived strictly from DB ($0 if unvalued) |
| **Accounts** | `inbound_intent_log` & `enrichment_summary` | `fetchInboundIntentLogs()` | `deriveAccountsFromInboundLogs()` | `company_domain`, `company_name`, `industry`, `enrichment_summary` (employee_count, country, tech_stack) | Empty table state with "Create Account" CTA; safe zero-denominator handling | **ZERO FABRICATION** — Removed fake $18.5M/$3.5M revenue defaults |
| **Contacts** | Local CRM state / CRM sync | `useCRM()` | `deriveContactsFromAccounts()` (returns `[]`) | None in raw inbound logs | Clean empty state: *"No contact roles recorded yet. Categorize stakeholders as Decision Makers, Champions, or Evaluators."* | **ZERO FABRICATION** — Excised fictitious personas (Karri Saarinen, Dr. Elena Rostova, Marcus Vance) |
| **Tasks** | `inbound_intent_log` | `fetchInboundIntentLogs()` | `deriveTasksFromInboundLogs()` | `company_domain`, `company_name`, `route`, `cache_hit`, `last_seen_at`, `created_at` | Empty state: *"No tasks yet. Action items and operational follow-ups will appear here."* | **ZERO FABRICATION** — Tasks created strictly for verified cache hits and priority review |
| **Operations / Telemetry** | `inbound_intent_log`, `rloe_telemetry`, `system_error_log` | `fetchInboundIntentLogs()`, `fetchRloeTelemetry()`, `fetchSystemErrorLogs()` | Direct rendering via `RloeTelemetryTable` and Inbound Intent Logs table | `company_domain`, `stage`, `route`, `outcome`, `cache_hit`, `llm_called`, `latency_ms`, `total_ms`, `est_cost_usd` | Displays RLS policy notice when telemetry table is restricted; renders all 12 genuine inbound logs | **ZERO FABRICATION** — Excised synthetic telemetry derivations |
| **AI Copilot** | In-memory GTM context & proxy endpoint | `queryGtmCopilot()` | Structured response parser | Live telemetry counts, account domains, routing criteria | Streaming / loading indicator with disabled input; graceful error banner | **ZERO FABRICATION** — Evaluates real firmographic records and verified telemetry |
| **Settings / Integrations** | Supabase REST, n8n webhook | `testSupabaseConnection()`, `testN8nConnection()`, `signInOperator()` | Status normalization (`ConnectionTestResult`) | Direct live ping tests against configured endpoints | Displays test latency or error message; session authentication badge | **ZERO FABRICATION** — No hardcoded secrets or simulated connection states |

---

## 2. Detailed Page-by-Page Audit & Repair Verification

### Page 1: Opportunities (`/opportunities`)
* **Real Source:** Rows in `inbound_intent_log` where `route IN ('sales_priority', 'needs_review')`.
* **Query:** `GET /rest/v1/inbound_intent_log?select=*&order=created_at.desc&limit=100` via `fetchInboundIntentLogs()`.
* **Transformation:** `deriveOpportunitiesFromInboundLogs()` in `pipelineAdapter.ts`.
* **Fields:**
  - Real DB fields: `id`, `company_domain`, `company_name`, `route`, `icp_fit_score`, `prefilter_score`, `created_at`.
  - Derived UI fields: `stage` (mapped to `'proposal'` or `'negotiation'` for ICP >= 90; `'discovery'` for needs_review), `nextStep` (descriptive operational action based on lane).
* **Valuation Integrity:** Previously hardcoded as $85,000 ARR for priority leads and $45,000 for review leads. **Repaired to use `Number(log.estimated_annual_revenue) || 0`.** Deals are clearly labeled as inbound evaluations with unvalued deal amounts until confirmed in CRM.
* **Verification:** Captured in `opportunities_page_1791886671203.png`. All priority leads render with authentic stage placements.

### Page 2: Accounts (`/accounts`)
* **Real Source:** Unique domains in `inbound_intent_log`.
* **Query:** `fetchInboundIntentLogs()`.
* **Transformation:** `deriveAccountsFromInboundLogs()` in `pipelineAdapter.ts`.
* **Fields:**
  - Real DB fields: `company_domain`, `company_name`, `enrichment_summary`.
  - Parsed enrichment fields: `employee_count`, `industry`, `country`.
* **Revenue Integrity:** Previously defaulted to $18,500,000 for priority leads and $3,500,000 for others. **Repaired to use genuine `estimated_annual_revenue` or $0.**
* **Verification:** Captured in `accounts_page_1791886681244.png`. 9 unique company accounts render with authentic headcount from Clay enrichment.

### Page 3: Contacts (`/contacts`)
* **Real Source:** Authoritative CRM contact records.
* **Integrity Resolution:** Inbound web signals do not contain verified contact identities (only anonymous visitor strings like `anon-audit-1791451973828`). A previous session invented fake people (`Karri Saarinen`, `Dr. Elena Rostova`, `Marcus Vance`, `Julian Sterling`).
* **Repair:** `deriveContactsFromAccounts()` now returns an empty array `[]`.
* **UI Behavior:** Contacts page renders an honest, clean empty state with full KPI support (0 contacts, 0% coverage) and a CTA to create contacts manually or sync from CRM.
* **Verification:** Captured in `contacts_page_1791886691573.png`. Zero fabricated identities appear anywhere in the UI.

### Page 4: Tasks (`/tasks`)
* **Real Source:** Inbound intent events with actionable operational triggers.
* **Transformation:** `deriveTasksFromInboundLogs()` in `pipelineAdapter.ts`.
* **Triggers:**
  1. Cache hit in Lane B: Creates follow-up task for returning lead.
  2. `sales_priority` lead: Creates executive briefing preparation task.
  3. `needs_review` lead: Creates firmographic review task.
* **Verification:** Tasks render with due dates, completion checkboxes, and clear lane attribution.

### Page 5: Operations / Telemetry (`/telemetry`)
* **Real Source:** `inbound_intent_log` (12 live rows), `rloe_telemetry` (16 live rows), `system_error_log` (20 live rows).
* **Integrity Resolution:** When querying with standard team tokens, `rloe_telemetry` returns 0 rows because PostgreSQL RLS restricts it to `service_role`. Previously, code synthesized fake execution records.
* **Repair:** Synthetic derivation was excised. `fetchRloeTelemetry()` returns only authentic database rows. When RLS restricts direct reads, `RloeTelemetryTable` displays a transparent notice explaining that `rloe_telemetry` is restricted to `service_role` under RLS. All 12 genuine records are accessible in the Inbound Intent Logs tab.
* **Verification:** Captured in `telemetry_page_1791886636277.png`. Inbound logs tab displays all 12 genuine records with source attribution and timestamps.
