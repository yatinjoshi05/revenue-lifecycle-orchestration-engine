# RLOE Interview Demo Guide — PowerShell / CMD Only

This guide is designed for presenting the **Revenue Lifecycle Orchestration Engine (RLOE)** directly from Windows PowerShell or Command Prompt during a US technical interview. **No Postman is required or used.**

---

## 1. How to Prepare PowerShell

Open Windows PowerShell (or Windows Terminal) on your machine.

Set execution policy if running scripts is restricted on your machine:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Navigate to the project root directory:
```powershell
cd D:\gtm
```

---

## 2. How to Verify Environment Variables

The demo scripts automatically discover the n8n authorization token from either:
- The active process environment variable `$env:RLOE_WEBHOOK_AUTH`
- Or the local `.env.local` configuration file (which is gitignored and stays locally on your disk)

To verify in PowerShell before starting:
```powershell
# Optional test to confirm token presence without printing it:
if ($env:RLOE_WEBHOOK_AUTH -or (Test-Path "D:\gtm\.env.local")) {
    Write-Host "RLOE Authorization configured successfully." -ForegroundColor Green
} else {
    Write-Warning "RLOE Authorization not detected. Export `$env:RLOE_WEBHOOK_AUTH = '<your-token>'"
}
```

---

## 3. Recommended Interview Demo Order & Rationale

| Order | Scenario | Script | Target Domain | Why This Sequence? |
| :--- | :--- | :--- | :--- | :--- |
| **1st** | **Low Score / Cost Control** | `.\RLOE_DEMO_2_INTERVIEW_LOW_SCORE.ps1` | `mikesbakerynyc.com` | **Hook the interviewer with engineering discipline.** Demonstrating that you screen out low-fit leads *before* invoking expensive LLM models immediately establishes seniority and cost consciousness. |
| **2nd** | **Duplicate Protection** | `.\RLOE_DEMO_3_INTERVIEW_DUPLICATE.ps1` | `retrieval.ai` | **Demonstrate cache-first state management.** Shows that your database uniqueness constraints prevent duplicate enrichment spend and CRM spam on repeated touches. |
| **3rd** | **High Score Happy Path** | `.\RLOE_DEMO_1_PRACTICE_HIGH_SCORE.ps1` | `linear.app` | **Deliver the grand finale.** Show the complete end-to-end pipeline: deep enrichment, deterministic scoring, NVIDIA Nemotron reasoning, automated HubSpot Deal ($150k), and real-time Kanban board updates. |

*(Note: `RLOE_DEMO_1_PRACTICE_HIGH_SCORE.ps1` is also used right now for your practice run).*

---

## 4. How to Run Demo 1 (Practice & Finale)

In PowerShell:
```powershell
.\RLOE_DEMO_1_PRACTICE_HIGH_SCORE.ps1
```
Or from Command Prompt:
```cmd
RLOE_DEMO_1_PRACTICE_HIGH_SCORE.bat
```

### Expected Output:
- Webhook Inbound Gate responds in `< 1500ms` with **HTTP 200 OK**.
- Script confirms signal acceptance and outlines downstream stages.

---

## 5. What to Watch Across Systems

### What to Watch in n8n (`https://yatinjoshi05.app.n8n.cloud`)
- Click **Executions** in the left sidebar.
- Open the latest execution for workflow `99MNkuUQuGSPIxXW`.
- Notice the green execution ticks:
  - `Webhook Inbound Gate` -> `Payload Verification Parser`
  - `Supabase Cache Check` (Cache Miss)
  - `Log Pending Row (Cache Guard)`
  - `Trigger Clay Waterfall`
  - Downstream scoring branch: `Deterministic Pre-Filter & Pre-Score` (Score ~95-100)
  - `Worth Spending LLM Tokens?` (Evaluates `true`)
  - `Claude GTM Router` (Executes **NVIDIA Nemotron** `nvidia/nemotron-3.5-lightning-30b-a3b` with 0.1 temp)
  - `Update Lead Record` (Supabase status: `scored`, route: `sales_priority`)
  - `High-Value Deal?` -> `HubSpot CRM Sync` (Creates Deal via HTTP 201)

### What to Verify in Supabase
Open your browser tab to the Supabase Table Editor or SQL Editor:
```sql
-- Check intent log:
SELECT company_domain, prefilter_score, route, routing_status, icp_fit_score, intent_strength_score, created_at
FROM inbound_intent_log
ORDER BY created_at DESC LIMIT 5;

-- Check telemetry:
SELECT execution_id, stage, outcome, llm_model, prompt_tokens, completion_tokens, est_cost_usd, latency_ms
FROM rloe_telemetry
ORDER BY created_at DESC LIMIT 5;
```
- For High Score: `route = 'sales_priority'`, `llm_model = 'nvidia/nemotron-3.5-lightning-30b-a3b'`, `outcome = 'scored_hot'`.
- For Low Score: `route = 'disqualified'`, `llm_called = false`, `outcome = 'skipped_llm_prefilter'`, `est_cost_usd = 0`.
- For Duplicate: `stage = 'cache_hit'`, `outcome = 'existing_lead_crm_task'`.

### What to Verify in HubSpot
Open HubSpot CRM:
1. **Deals** (`/contacts/.../deals`):
   - Locate the deal: `linear.app - Enterprise Inbound`
   - Stage: `Appointment Scheduled`
   - Amount: `$150,000`
2. **Tasks** (`/tasks`):
   - Notice the high-priority task created for the sales representative.

### What to Show in the Frontend (`http://localhost:3000`)
- Open the GTM Opportunity Board.
- Point to the **Sales Priority** column:
  - Show the card for `linear.app` with its AI reasoning, ICP score, and dynamic valuation.

---

## 6. How to Run Demo 2 During Interview (Low Score)

In PowerShell:
```powershell
.\RLOE_DEMO_2_INTERVIEW_LOW_SCORE.ps1
```
Or from Command Prompt:
```cmd
RLOE_DEMO_2_INTERVIEW_LOW_SCORE.bat
```

### What Happens:
- Inbound signal for `mikesbakerynyc.com` is accepted.
- Clay profile returns retail bakery with < 10 employees.
- Deterministic pre-filter calculates score < 35.
- `Worth Spending LLM Tokens?` evaluates to **FALSE**.
- NVIDIA Nemotron is **bypassed completely**.
- Telemetry records `0` tokens, `$0.00` cost, and outcome `skipped_llm_prefilter`.
- Zero CRM tasks/deals created in HubSpot.

---

## 7. How to Run Demo 3 During Interview (Duplicate Cache)

In PowerShell:
```powershell
.\RLOE_DEMO_3_INTERVIEW_DUPLICATE.ps1
```
Or from Command Prompt:
```cmd
RLOE_DEMO_3_INTERVIEW_DUPLICATE.bat
```

### What Happens:
- **Touch 1**: First-seen company `retrieval.ai` is dispatched. It triggers a cache miss and writes a pending cache-guard row.
- Script automatically pauses 6 seconds.
- **Touch 2**: The SAME company `retrieval.ai` is dispatched with a new anonymous visitor ID.
- Inbound gate matches the existing company in Supabase.
- **Bypasses Clay waterfall** (Zero API credits used).
- **Bypasses NVIDIA Nemotron** (Zero LLM tokens used).
- Triggers HubSpot Task **"Returning Lead"** to alert the account executive.
- Updates `last_seen_at` in Supabase without creating a duplicate row.

---

## 8. What to Say During the Interview

### During Demo 2 (Low Score):
> *"Here is how we protect infrastructure and LLM operating costs. Local businesses and unqualified visitors frequently browse our marketing pages. When a bakery hits the gate, our deterministic pre-filter screens the headcount and industry in sub-10 milliseconds. Because the score is under 35 points, our cost gate blocks LLM invocation completely. In our telemetry table, you will see zero tokens consumed and zero dollars spent. More importantly, we prevented our sales team from receiving low-quality CRM noise."*

### During Demo 3 (Duplicate):
> *"In enterprise B2B sales cycles, buying committee members from the same target company visit our site multiple times from different devices. We enforce domain uniqueness at the database level. When an existing company returns, we never re-trigger expensive Clay enrichment or burn LLM tokens. Instead, the engine executes a fast-path cache hit, updates the last-seen timestamp, and fires an instant 'Returning Lead' alert directly into HubSpot."*

### During Demo 1 (High Score):
> *"Now let's observe our enterprise happy path. Notice the webhook responds in under 400 milliseconds—we decouple ingestion from downstream enrichment so our web applications never block on external APIs. In the background, our cache guard registers a pending intent row, Clay enriches company metadata, and our deterministic pre-filter qualifies the account at 95 points. Because it clears our ICP threshold, it invokes our NVIDIA Nemotron-3.5-Lightning LLM router, which analyzes buying intent and generates an Enterprise deal in HubSpot in real time."*

---

## 9. Handling Real-World External Conditions

### What to do if Clay is slow:
> *"Because enrichment calls execute asynchronously via a callback webhook pattern, third-party provider latency never degrades our user's web experience. The webhook responds with HTTP 200 instantly, and our idempotency lock in Supabase ensures the lead state transitions cleanly whenever the provider completes."*

### What to do if Clay returns incomplete data:
> *"In production, enrichment providers frequently return sparse data for early-stage or international companies. The engine does not crash or make blind assumptions. Our schema validator applies safe defaults, the deterministic pre-filter scores only verified attributes, and if critical qualification parameters are absent, the engine safely routes the lead to disqualified or human review without burning LLM tokens."*

### What to do if NVIDIA is skipped:
> *"Skipping the LLM is an intentional architectural guardrail, not an error. Gating inference behind heuristic rules saves 80%+ of API spend while giving sub-10 millisecond routing guarantees for low-fit leads."*

### What to do if the company is already cached:
> *"That validates our cache-first design. We never re-pay for enrichment or re-generate intelligence on known accounts."*

---

## 10. Rules & Security During Interview

1. **Do NOT open `.env.local`** while sharing your screen.
2. **Do NOT reactivate PLG Poller** in n8n.
3. **Do NOT modify working workflow nodes** during the interview.
4. Keep the PowerShell window, Supabase table editor, and HubSpot deals tab neatly arranged across your workspace.
