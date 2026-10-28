# RLOE Metric Definitions, Formulas & Limitations Specification

**Project:** Revenue Lifecycle Orchestration Engine (RLOE)  
**Workspace:** `D:\gtm`  
**Date:** October 13, 2026  
**Auditor:** Revenue Operations Architect & QA Automation Engineer  

---

## 1. Metric Audit & Ground Truth Recalculation

An earlier preliminary report cited several KPI figures that were based on synthetic multipliers rather than verified database fields. Below is the forensic comparison between earlier claims and verified ground truth:

| KPI Metric Name | Previously Reported Claim | Verified Ground Truth Value | Primary Discrepancy & Root Cause |
| :--- | :--- | :--- | :--- |
| **Total Inbound Signals** | 12 inbound signals | **12 verified signals** | Accurately reflects 12 rows in `inbound_intent_log`. |
| **Execution Telemetry Events** | 12 telemetry events | **16 rows in DB / 0 with team session** | The live `rloe_telemetry` table has 16 rows under `service_role`, but PostgreSQL RLS restricts reads by `authenticated` users. Previously synthesized 12 fake rows. |
| **Cache Triage Resolution Rate** | 25% | **25%** | 1 verified cache hit out of 4 rows with explicit boolean `cache_hit` (or 2 cache hits out of 16 telemetry rows = 12.5%). Handled zero-denominator safely. |
| **Hot Sales Pipeline Velocity** | $340,000 | **4 Qualified Leads ($0 confirmed ARR)** | Previously multiplied 4 priority accounts by an arbitrary $85,000. Real `estimated_annual_revenue` in DB is null/0. |
| **Tracked Account Revenue** | $106,500,000 | **$0 confirmed ARR / Unvalued** | Previously defaulted priority accounts to $18,500,000 each. Real DB has null annual revenue. |
| **Active Pipeline Value** | $520,000 | **$0 confirmed pipeline ($0 confirmed ARR)** | Fabricated by summing synthetic $85k and $45k deal amounts. |
| **Average Execution Latency** | 139 ms | **— (RLS Restricted) / 10,741 ms in service_role** | 139 ms was fabricated in earlier derived telemetry. Real telemetry latency spans 11 ms to 59,411 ms (average ~10.7s including Clay enrichment). |

---

## 2. Standard Metric Definitions & Mathematical Formulas

### Metric 1: Total Webhook Signals Ingested
* **Display Location:** Operations Header KPI Card 1 (`RloeMetricsCards.tsx`)
* **Mathematical Formula:**
  $$\text{Total Signals} = \text{COUNT}(\text{inbound\_intent\_log})$$
* **Source Fields:** `inbound_intent_log.id`
* **Time Window:** All-time cumulative (bounded to last 100 entries via query limit)
* **Zero Handling:** Returns `0` with label `"no signals yet"`
* **Known Limitations:** Counts raw accepted webhook events. If a client retries the same anonymous visitor multiple times without domain deduplication at the edge, each attempt recorded in `inbound_intent_log` increments this counter.

### Metric 2: Cache Triage Resolution Rate
* **Display Location:** Operations Header KPI Card 2 (`RloeMetricsCards.tsx`)
* **Mathematical Formula:**
  $$\text{Cache Triage Rate} = \begin{cases} \text{round}\left(\frac{\sum [l.\text{cache\_hit} = \text{true}]}{\sum [l.\text{cache\_hit} \in \{\text{true}, \text{false}\}]} \times 100\right) & \text{if denominator} > 0 \\ 0\% & \text{otherwise} \end{cases}$$
* **Source Fields:** `inbound_intent_log.cache_hit`
* **Time Window:** Evaluated across all ingested records with a defined boolean `cache_hit`
* **Zero Handling:** If no eligible records exist, returns `0%` (displays `—`) to prevent `NaN` or division by zero.
* **Known Limitations:** Inbound events ingested before the cache check was deployed may have `cache_hit: null`. These rows are safely excluded from the denominator to maintain mathematical accuracy.

### Metric 3: Priority Qualified Leads (Formerly "Hot Sales Pipeline Velocity")
* **Display Location:** Operations Header KPI Card 3 (`RloeMetricsCards.tsx`)
* **Mathematical Formula:**
  $$\text{Confirmed Priority Value} = \sum_{l \in \text{inbound\_intent\_log}, l.\text{route} = \text{'sales\_priority'}} \text{COALESCE}(l.\text{estimated\_annual_revenue}, 0)$$
* **Source Fields:** `inbound_intent_log.route`, `inbound_intent_log.estimated_annual_revenue`
* **Time Window:** All active qualified inbound leads
* **Formatting Behavior:**
  - If `Confirmed Priority Value > 0`, formats as USD currency.
  - If `Confirmed Priority Value == 0`, displays `${count} Qualified Leads` with subtitle `"Deals unvalued ($0 confirmed ARR)"`.
* **Critical Rule:** Never multiplies routing decisions by an assumed $85,000 deal benchmark. If deal value is unrecorded, it is honestly reported as unvalued.

### Metric 4: Average Execution Latency
* **Display Location:** Operations Header KPI Card 4 (`RloeMetricsCards.tsx`)
* **Mathematical Formula:**
  $$\text{Avg Latency} = \begin{cases} \text{round}\left(\frac{\sum t.\text{total\_ms}}{\text{COUNT}(t.\text{total\_ms} > 0)}\right) & \text{if valid rows} > 0 \\ \text{null} & \text{otherwise} \end{cases}$$
* **Source Fields:** `rloe_telemetry.total_ms` or `rloe_telemetry.latency_ms`
* **Time Window:** Bounded to the last 100 execution records
* **Zero Handling:** Returns `null` (displays `—`) when telemetry table is empty or restricted by RLS.
* **Known Limitations:** The remote database restricts `rloe_telemetry` to `service_role`. Standard team sessions receive 0 direct rows; the card displays `—` with subtitle `"RLS Restricted"` rather than synthesizing fabricated latencies.

### Metric 5: Account Coverage & Pipeline Value
* **Display Location:** Accounts Page & Up Next Page
* **Mathematical Formulas:**
  - Account Coverage % = `Math.round((accountsWithOpps / totalAccounts) * 100)`
  - Total Tracked Revenue = `accounts.reduce((sum, a) => sum + (a.revenue || 0), 0)`
  - Total Pipeline = `opportunities.reduce((sum, o) => sum + (o.amount || 0), 0)`
* **Zero Handling:** All percentage denominators check `totalAccounts > 0 ? ... : 0`.
