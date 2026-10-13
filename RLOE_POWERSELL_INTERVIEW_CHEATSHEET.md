# RLOE Interview Demo — One-Page Cheat Sheet (PowerShell / CMD)

Keep this open on your secondary screen or print it for your interview.

---

### DEMO 2 (1st in Interview): LOW SCORE / COST CONTROL
- **WHAT I RUN**:
  `.\RLOE_DEMO_2_INTERVIEW_LOW_SCORE.ps1` (or `.bat`)
- **WHAT HAPPENS**:
  Inbound signal for `mikesbakerynyc.com` accepted in < 500ms → Clay profile shows small retail bakery → Deterministic pre-filter scores < 35 → Cost Gate evaluates to FALSE → NVIDIA Nemotron is **SKIPPED** ($0 cost, 0 tokens) → Route: `disqualified` → 0 CRM noise in HubSpot.
- **WHAT I SHOW**:
  1. PowerShell terminal showing instant HTTP 200 acceptance.
  2. n8n execution canvas showing grayed-out/unexecuted LLM branch.
  3. Supabase `rloe_telemetry` row: `outcome = 'skipped_llm_prefilter'`, `est_cost_usd = 0`, `llm_called = false`.
- **WHAT I SAY**:
  *"This demonstrates our cost governance architecture. Rather than burning LLM tokens on every unqualified web visitor, our sub-10ms deterministic pre-filter screens out low-ICP leads, achieving 80%+ API cost savings."*
- **WHAT I SHOULD VERIFY**:
  Zero HubSpot deals or tasks created; telemetry confirms 0 tokens spent.
- **WHAT IF CLAY FAILS?**:
  Incomplete or missing enrichment defaults to score <= 15, which safely fails the >= 35 threshold and routes to disqualified without burning LLM tokens.
- **WHAT IF THE RESULT IS DIFFERENT?**:
  Verify the pre-filter threshold constant (`MIN_PRESCORE = 35`); retail domains always remain below 20.

---

### DEMO 3 (2nd in Interview): DUPLICATE CACHE-FIRST ARCHITECTURE
- **WHAT I RUN**:
  `.\RLOE_DEMO_3_INTERVIEW_DUPLICATE.ps1` (or `.bat`)
- **WHAT HAPPENS**:
  - **Touch 1**: First visit from `retrieval.ai` creates initial cache-guard row.
  - **Touch 2**: Revisit from `retrieval.ai` triggers an **instant cache hit** in Supabase → Bypasses Clay waterfall (0 API credits) → Bypasses NVIDIA Nemotron (0 tokens) → Creates HubSpot Task: "Returning Lead" → Updates `last_seen_at` without duplicate DB records.
- **WHAT I SHOW**:
  1. Terminal showing both touches executed cleanly.
  2. Supabase `inbound_intent_log`: Show only **1 row** exists for `retrieval.ai` with updated `last_seen_at`.
  3. HubSpot Tasks: Show the "Returning Lead" touch task alerting the sales rep.
- **WHAT I SAY**:
  *"Repeated visits from target accounts shouldn't re-trigger expensive enrichment or re-run LLMs. Our cache-first gate enforces domain uniqueness, saving budget while alerting reps to re-engagement."*
- **WHAT I SHOULD VERIFY**:
  Telemetry has `stage = 'cache_hit'`, `outcome = 'existing_lead_crm_task'`.
- **WHAT IF CLAY FAILS?**:
  Cache hits never touch Clay—Touch 2 executes purely against Supabase and HubSpot.
- **WHAT IF THE RESULT IS DIFFERENT?**:
  If Touch 1 had already been run earlier, both will register as cache hits; deleting the test row in Supabase resets it cleanly.

---

### DEMO 1 (3rd in Interview / Practice): HIGH SCORE HAPPY PATH
- **WHAT I RUN**:
  `.\RLOE_DEMO_1_PRACTICE_HIGH_SCORE.ps1` (or `.bat`)
- **WHAT HAPPENS**:
  Inbound signal for `linear.app` accepted in < 500ms → Clay enriches enterprise SaaS profile → Deterministic pre-filter scores 95/100 → Cost Gate evaluates to TRUE → NVIDIA Nemotron generates structured GTM reasoning → Route: `sales_priority` → Deal ($150,000) created in HubSpot → Telemetry logged → Frontend updates live.
- **WHAT I SHOW**:
  1. n8n execution canvas showing full green pipeline through NVIDIA Nemotron.
  2. Supabase `inbound_intent_log` row with `sales_priority` route and `icp_fit_score >= 70`.
  3. HubSpot Deals: Show the `$150,000` Enterprise Deal under `Appointment Scheduled`.
  4. Frontend UI: Show `linear.app` card appearing under Sales Priority column.
- **WHAT I SAY**:
  *"The webhook decouples ingestion from enrichment so the client web app never hangs. In the background, our deterministic pre-filter qualifies the ICP, NVIDIA Nemotron extracts buying signals, and a high-value pipeline deal is generated in HubSpot in under 5 seconds."*
- **WHAT I SHOULD VERIFY**:
  HubSpot Deal exists; `rloe_telemetry` shows `model = 'nvidia/nemotron-3.5-lightning-30b-a3b'`.
- **WHAT IF CLAY FAILS?**:
  If external Clay callback is delayed, the webhook has already returned HTTP 200 to the client, and Supabase holds the pending cache guard until the callback completes.
- **WHAT IF THE RESULT IS DIFFERENT?**:
  If NVIDIA experiences API downtime, the workflow's fallback route assigns `sales_priority` based purely on deterministic score >= 90.
