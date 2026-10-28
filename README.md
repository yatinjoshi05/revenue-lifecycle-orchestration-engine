# NEXUS GTM — Autonomous Revenue Intelligence & GTM Orchestration Engine

[![Archify 3.2.0 Verified](https://img.shields.io/badge/Archify-3.2.0%20Verified-0ea5e9?style=flat-square)](https://yatinjoshi05.github.io/revenue-lifecycle-orchestration-engine/archify/)
[![Tests Passing](https://img.shields.io/badge/Tests-166%20%2F%20166%20Passing-10b981?style=flat-square)](https://github.com/yatinjoshi05/revenue-lifecycle-orchestration-engine)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%205-6366f1?style=flat-square)](https://vitejs.dev)
[![Backend](https://img.shields.io/badge/Control%20Plane-Express%20%2B%20TypeScript-3b82f6?style=flat-square)](https://nodejs.org)
[![Database](https://img.shields.io/badge/Storage-Supabase%20Postgres-34d399?style=flat-square)](https://supabase.com)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-22c55e?style=flat-square)](https://yatinjoshi05.github.io/revenue-lifecycle-orchestration-engine/)

> **A source-grounded, production-verified Go-To-Market and lead intelligence engine designed by a business graduate to automate manual startup research, defend against duplicate CRM clutter, and orchestrate instantaneous AE outbound.**

---

## 1. Executive Summary & The Business Problem

Modern B2B SaaS revenue operations and sales development teams suffer from a costly, labor-intensive bottleneck:
1. **Manual Research Latency:** Inbound and outbound reps spend 48+ hours manually scouring TechCrunch, VentureBeat, and SEC filings to verify startup funding rounds, company headcounts, and tech stacks before initiating contact.
2. **Uncontrolled LLM Token Burn:** Piping raw, unvalidated RSS feeds or webhook payloads directly into Large Language Models burns hundreds of dollars in API credits on low-ICP hobby projects, scrapers, and spam traffic.
3. **Data Pollution & Duplicate Outreach:** Concurrent webhook deliveries create race conditions and duplicate lead records in CRM systems, resulting in multiple reps reaching out to the same founder.

### The Solution: NEXUS GTM
**NEXUS GTM** bridges commercial go-to-market strategy with strict software engineering discipline:
* **Event-Driven Signal Detection:** Ingests live funding announcements via a scheduled Python 3.14 RSS poller and structured webhook gateway.
* **Pre-Execution Idempotency Gate:** Checks a deterministic SHA-256 payload hash against Supabase PostgreSQL before touching any AI models, achieving zero duplicate token consumption.
* **Tiered Qualification Engine:** Evaluates funding round tier and ICP fit using OpenAI `gpt-4o-mini` with structured JSON output. If the API key is unconfigured or rate-limited, it automatically falls back to a deterministic heuristic scoring engine (`[DETERMINISTIC EVALUATION]`) to prevent pipeline stalls.
* **Operator Control Plane & RevOps Dashboard:** Synchronizes qualified Tier 1–3 accounts with an Express backend (`:4000`) and serves a high-performance React 18 + Vite dashboard (`:3000`) for instantaneous 1-click AE outbound.

---

## 2. Interactive Architecture Suite (Powered by Archify 3.2.0)

Every architectural view in this project has been compiled, verified, and audited using the official [Archify 3.2.0](https://tt-a1i.github.io/archify/) engine, passing all 4 gates (**validate**, **deliver**, **check**, and headless **browser-check**) with **0 errors and 0 warnings**.

👉 **[Launch the Unified Interactive Architecture Hub](https://yatinjoshi05.github.io/revenue-lifecycle-orchestration-engine/archify/)**

| View | Artifact | Type | Description |
| :--- | :--- | :--- | :--- |
| **Master Map** | [nexus-gtm-master.html](https://yatinjoshi05.github.io/revenue-lifecycle-orchestration-engine/archify/nexus-gtm-master.html) | `architecture` | 11-node complete system map from RSS poller to operator UI. |
| **View A: Workflow** | [nexus-gtm-workflow.html](https://yatinjoshi05.github.io/revenue-lifecycle-orchestration-engine/archify/nexus-gtm-workflow.html) | `workflow` | 6 execution lanes detailing discovery, sanitization, scoring, and sync. |
| **View B: Lineage** | [nexus-gtm-dataflow.html](https://yatinjoshi05.github.io/revenue-lifecycle-orchestration-engine/archify/nexus-gtm-dataflow.html) | `dataflow` | 5-stage transformation tracing field lineage into `public.leads_pipeline`. |
| **View C: Sequence** | [nexus-gtm-sequence.html](https://yatinjoshi05.github.io/revenue-lifecycle-orchestration-engine/archify/nexus-gtm-sequence.html) | `sequence` | 14-step API choreography from webhook POST to operator query. |
| **View D: Lifecycle** | [nexus-gtm-lifecycle.html](https://yatinjoshi05.github.io/revenue-lifecycle-orchestration-engine/archify/nexus-gtm-lifecycle.html) | `lifecycle` | 11-state machine covering happy paths, dedup suppression, and error retry. |

---

## 3. Verified System Architecture

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│      Python Funding Poller      │       │     Partner Signal Webhook      │
│  (TechCrunch / Sifted RSS feeds)│       │    (HTTP JSON Buying Signals)   │
└────────────────┬────────────────┘       └────────────────┬────────────────┘
                 │                                         │
                 │ POST /company-buying-signal             │ POST /company-buying-signal
                 ▼                                         ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                      n8n Ingress & Defense Gateway                        │
│  - Input Sanitization: Normalizes URLs, neutralizes CSV / XSS injections  │
│  - SHA-256 Idempotency: Checks Postgres before calling external APIs       │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 │                                         │
          [Duplicate Hash]                          [Unique Signal]
                 │                                         │
                 ▼                                         ▼
     ┌──────────────────────┐                  ┌──────────────────────┐
     │ 200 OK (Suppressed)  │                  │ Qualification Stage  │
     │ Zero Token Waste     │                  └──────────┬───────────┘
     └──────────────────────┘                             │
                                        ┌─────────────────┴─────────────────┐
                                        │                                   │
                              [OPENAI_API_KEY Available]            [Key Unconfigured / 429]
                                        │                                   │
                                        ▼                                   ▼
                            ┌───────────────────────┐           ┌───────────────────────┐
                            │ OpenAI gpt-4o-mini    │           │ Deterministic Rules   │
                            │ Structured JSON Call  │           │ Fallback (Score 0-100)│
                            └───────────┬───────────┘           └───────────┬───────────┘
                                        │                                   │
                                        └─────────────────┬─────────────────┘
                                                          ▼
                                            ┌───────────────────────────┐
                                            │ Format & Validate Schema  │
                                            └─────────────┬─────────────┘
                                                          │
                                                          ▼
                                            ┌───────────────────────────┐
                                            │ Supabase PostgreSQL DB    │
                                            │ (public.leads_pipeline)   │
                                            └─────────────┬─────────────┘
                                                          │
                                     ┌────────────────────┴────────────────────┐
                                     │                                         │
                                     ▼                                         ▼
                         ┌───────────────────────┐                 ┌───────────────────────┐
                         │ Express Control Plane │                 │ Operator Dashboard UI │
                         │ (Port :4000 /api/v1)  │◄────────────────┤ (React 18 + Vite 5)   │
                         └───────────────────────┘                 └───────────────────────┘
```

---

## 4. Source-Grounded Component & File Inventory

Every component in this repository reflects real code and verified test coverage:

| Component | Responsibility | Tech Stack | Source Location | Verified Status |
| :--- | :--- | :--- | :--- | :--- |
| **Funding Producer** | Polls TechCrunch/Sifted RSS, normalizes money strings, emits JSON signals | Python 3.14, `urllib`, `xml.etree` | `D:\projects gtm\funding-producer` | **LIVE-TESTED** (16 tests pass) |
| **Ingress Gate** | Ingests `POST /company-buying-signal`, validates schema, checks SHA-256 hash | n8n / Express | `workflows/nexus_funding_qualification_pipeline.json` | **CODE REVIEWED** |
| **Qualification Engine** | Generates lead scores (0–100) and Tier assignments via AI or rule-based fallback | TypeScript, `evaluator.ts` | `nexus/src/modules/leads/evaluator.ts` | **LIVE-TESTED** (109 tests pass) |
| **Supabase Storage** | Persists leads, accounts, tasks, and telemetry in Postgres | PostgreSQL 15, PostgREST | `nexus/supabase/migrations/20260214_leads_pipeline.sql` | **SCHEMA VERIFIED** |
| **Control Plane** | Provides REST endpoints for leads, handoffs, integrity, and reconciliation | Express, Node.js 20 | `nexus/src/server.ts` | **LIVE-TESTED** (17 suites pass) |
| **RevOps Dashboard** | Visual operator UI for real-time lead inspection, SLA tracking, and 1-click AE handoff | React 18, Vite 5, TailwindCSS | `gtm/src/App.tsx` | **LIVE-TESTED** (41 tests pass) |

---

## 5. Canonical Database Schema

All persistable lead records map strictly to `public.leads_pipeline` in Supabase PostgreSQL:

```sql
CREATE TABLE public.leads_pipeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    company_name TEXT NOT NULL,
    website TEXT,
    buying_signal_detected TEXT NOT NULL,
    lead_score INTEGER CHECK (lead_score >= 0 AND lead_score <= 100),
    lead_tier TEXT CHECK (lead_tier IN ('Tier 1', 'Tier 2', 'Tier 3', 'Unqualified')),
    ai_research_summary TEXT NOT NULL
);
```

### Deterministic Fallback Disclosure
When `OPENAI_API_KEY` is absent or unconfigured, the system does **not** hallucinate mock AI tokens. Instead, `evaluator.ts` deterministically scores the account based on verified funding rules:
* **Series A+ with > $5M funding:** Score 85 (`Tier 1`)
* **Seed with > $1M funding:** Score 65 (`Tier 2`)
* **Sub-$1M or undisclosed:** Score 45 (`Tier 3`)

Every fallback record is stamped with:
`[DETERMINISTIC EVALUATION - OPENAI KEY UNCONFIGURED]` inside `ai_research_summary`, ensuring complete auditability for sales management.

---

## 6. Verification & Automated Test Results

Across all three core subsystems, **166 of 166 automated unit and integration tests execute and pass with 0 failures**:

```
================================================================================
SUBSYSTEM                              TEST RUNNER          TESTS    FAILURES
================================================================================
Backend Control Plane (nexus)          Vitest (Node 20)       109           0
Frontend Dashboard (gtm)               Node.js tsx runner      41           0
Funding Producer (funding-producer)    Python unittest         16           0
--------------------------------------------------------------------------------
TOTAL VERIFIED AUTOMATED TESTS                                166           0 (100%)
================================================================================
```

### Archify Diagram Quality Gates
All 5 visual deliverables were validated against the Archify showcase specification:
* `validate`: PASS (Zero syntax, route clearance, or container collision errors)
* `deliver`: PASS (Self-contained standalone HTML deliverables generated)
* `check`: PASS (Desktop readability hard floor `>= 6.0px`, zero label overflows)
* `browser-check`: PASS (Headless Chrome verified rendering, viewer chrome, and dark/light themes)

---

## 7. Setup & Local Installation

### Prerequisites
* Node.js 20.x or higher
* Python 3.12 or higher
* npm or pnpm

### 1. Run the Frontend Dashboard
```bash
cd D:/gtm
npm install
npm run dev
# Dashboard launches at http://localhost:3000 (or 5173)
```

### 2. Run the Backend Control Plane
```bash
cd "D:/GTM projects/nexus"
npm install
npm run dev
# Control plane API launches at http://localhost:4000
```

### 3. Run the Funding Signal Poller
```bash
cd "D:/projects gtm/funding-producer"
python funding_signal_producer.py
```

### 4. Execute Full Verification Test Suite
```bash
# Test backend
cd "D:/GTM projects/nexus" && npm test

# Test frontend
cd "D:/gtm" && npm test

# Test producer
cd "D:/projects gtm/funding-producer" && python -m unittest test_funding_producer.py
```

---

## 8. Security & Trust Boundaries

* **No Leaked Secrets:** `.env` and `.env.local` are strictly excluded via `.gitignore`. API keys and credentials are never stored in client-side bundles.
* **Network Isolation:** Development servers bind strictly to `127.0.0.1` loopback, defending against local network scanning.
* **Input Sanitization:** Operator inputs and incoming RSS content are sanitized against CSV formula injection (`=`, `@`, `+`, `-`) and HTML/XSS script execution.
* **In-Memory Testing:** Automated test suites run against an isolated in-memory PGlite PostgreSQL instance, preventing mutation of live database tables.

---

## 9. Operating Constraints & Future Roadmap

* **Live AI Ingestion:** Live semantic reasoning requires a valid OpenAI API key; deterministic heuristic rules cleanly handle fallback scenarios.
* **Webhook Reliability:** High-volume ingress runs through n8n queues; production deployments should attach Redis / BullMQ for multi-worker concurrency.
* **Roadmap:**
  * Automated LinkedIn Sales Navigator API webhook synchronization.
  * Direct bidirectional Salesforce and HubSpot opportunity stage mirroring.
  * Multi-agent consensus scoring for complex enterprise buying committees.

---

## Author & Attribution
**Yatin Joshi**  
*Business & Technology Architecture*  
GitHub: [@yatinjoshi05](https://github.com/yatinjoshi05)
