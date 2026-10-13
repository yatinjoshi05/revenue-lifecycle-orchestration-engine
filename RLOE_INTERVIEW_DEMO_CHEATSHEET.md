# RLOE Interview Demo — One-Page Cheat Sheet

Print this or keep it on your secondary monitor during the live interview.

---

### 1. HIGH SCORE DEMO (`linear.app`)
- **What happens?**
  Inbound webhook accepts payload (<500ms) → Cache check sees new lead → Clay waterfall enriches headcount & tech stack → Deterministic pre-filter scores 95/100 → Gating rule triggers NVIDIA Nemotron-3.5-Lightning LLM router → Sales Priority route assigned → Deal ($150k) and High-Priority Task created in HubSpot → Telemetry logged → Frontend board updates live.
- **What should I point at?**
  1. Postman response time (<500ms).
  2. n8n execution canvas showing green branch through NVIDIA Nemotron.
  3. Supabase `inbound_intent_log` row with `sales_priority` route and score `95`.
  4. HubSpot deal under `Appointment Scheduled`.
- **What should I say?**
  *"The webhook decouples ingestion from enrichment so the client web app never hangs. In the background, our deterministic pre-filter qualifies the ICP, NVIDIA Nemotron extracts buying signals, and a high-value pipeline deal is generated in HubSpot in under 5 seconds."*

---

### 2. LOW SCORE DEMO (`mikesbakerynyc.com`)
- **What happens?**
  Inbound webhook accepts payload (<500ms) → Clay enriches small headcount & non-tech industry → Deterministic pre-filter scores <35 → LLM Cost Gate evaluates to `FALSE` → NVIDIA Nemotron is **skipped entirely** → Lead marked `disqualified` → Zero HubSpot noise created → Telemetry records `0` prompt tokens and `$0.00` spend.
- **What should I point at?**
  1. n8n execution graph showing the LLM branch was unexecuted (grayed out).
  2. Supabase `rloe_telemetry` table showing `outcome = 'skipped_llm_prefilter'` with `estimated_cost_usd = 0`.
- **What should I say?**
  *"This demonstrates our cost governance architecture. Rather than burning LLM tokens on every unqualified visitor, our sub-10ms deterministic pre-filter screens out low-ICP leads, achieving 80%+ API cost savings."*

---

### 3. DUPLICATE DEMO (`retrieval.ai` — Send Twice)
- **What happens?**
  - **Click 1**: Cache miss → Enriches and stores initial record.
  - **Click 2**: Cache hit → Database unique domain check catches existing lead → Completely bypasses Clay and NVIDIA → Creates a "Returning Lead" task in HubSpot → Updates `last_seen_at` without duplicate DB records.
- **What should I point at?**
  1. Supabase `inbound_intent_log`: Show only **1 row** exists for `retrieval.ai`, with `last_seen_at` freshly bumped.
  2. HubSpot Tasks view: Show the "Returning Lead" touch task alerting the sales rep.
- **What should I say?**
  *"Repeated visits from target accounts shouldn't re-trigger expensive enrichment or re-run LLMs. Our cache-first gate enforces domain uniqueness, saving budget while alerting reps to re-engagement."*

---

### 4. CLAY FAILURE / LATENCY
- **What happens?**
  If Clay experiences timeout or returns sparse fields, the schema validator applies safe defaults. The deterministic filter scores only verified attributes. Missing core data routes to an operator review queue rather than failing silently.
- **What should I say?**
  *"In production, third-party enrichment can be brittle. We treat external APIs as untrusted: our callback webhook handles timeouts gracefully, validates data contracts, and routes incomplete records to human triage."*

---

### 5. NVIDIA / LLM FAILURE
- **What happens?**
  If the LLM endpoint returns a 5xx or rate limit, the workflow catches the error via the fallback path, assigning a heuristic fallback route (`sales_priority` based purely on deterministic score >= 90) and logging `llm_fallback` to telemetry.
- **What should I say?**
  *"Our architecture never allows external model downtime to block revenue pipeline. If the model API degrades, the engine falls back to high-confidence deterministic routing without dropping deals."*

---

### 6. HUBSPOT INTEGRATION
- **What happens?**
  n8n dispatches authenticated REST requests using dedicated service tokens to create Deals and Tasks with idempotency guards.
- **What should I point at?**
  1. The newly created Deal in the `Appointment Scheduled` pipeline stage with the dynamic revenue amount ($150,000).
  2. The automated High-Priority Task assigned to the sales rep with the AI-generated intent summary.
