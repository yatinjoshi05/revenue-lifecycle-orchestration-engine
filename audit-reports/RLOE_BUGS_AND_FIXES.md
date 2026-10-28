# RLOE Bugs & Fixes Documentation

**Project:** Revenue Lifecycle Orchestration Engine (RLOE)  
**Workspace:** `D:\gtm`  
**Date:** October 13, 2026  

---

## Bug 1: Hardcoded Operator Credentials & Private Headers in `vite.config.ts`

### Severity: CRITICAL (Security Vulnerability)
* **Location:** `d:\gtm\vite.config.ts`
* **Description:** The Vite configuration used `define` to inject private operator credentials and n8n authentication headers into the client-side bundle:
  ```typescript
  // BEFORE (Vulnerable)
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
    'import.meta.env.VITE_N8N_WEBHOOK_URL': JSON.stringify(env.VITE_N8N_WEBHOOK_URL || ''),
    'import.meta.env.VITE_N8N_AUTH_HEADER_NAME': JSON.stringify(env.N8N_AUTH_HEADER_NAME || 'Authorization'),
    'import.meta.env.VITE_N8N_AUTH_HEADER_VALUE': JSON.stringify(env.N8N_AUTH_HEADER_VALUE || ''),
    'import.meta.env.VITE_OPERATOR_EMAIL': JSON.stringify(env.VITE_OPERATOR_EMAIL || 'operator@revops.local'),
    'import.meta.env.VITE_OPERATOR_PASSWORD': JSON.stringify(env.VITE_OPERATOR_PASSWORD || '[REDACTED_OPERATOR_PASSWORD]'),
  }
  ```
* **Impact:** Every production build baked the operator password and private n8n bearer token into `dist/assets/*.js`.
* **Fix Applied:** Removed lines 13–16 completely. Only client-safe public URLs and the publishable key are defined:
  ```typescript
  // AFTER (Hardened)
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || env.SUPABASE_URL || ''),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || ''),
    'import.meta.env.VITE_N8N_WEBHOOK_URL': JSON.stringify(env.VITE_N8N_WEBHOOK_URL || env.N8N_WEBHOOK_PROD_URL || ''),
  }
  ```

---

## Bug 2: Automated Password-Grant Authentication & Static Credentials in `rloe.ts`

### Severity: HIGH (Security & Architecture Defect)
* **Location:** `d:\gtm\src\services\rloe.ts`
* **Description:** `getAuthenticatedToken()` previously performed an automated password grant on page load using fallback credentials `'operator@revops.local'` and `'[REDACTED_OPERATOR_PASSWORD]'`.
* **Fix Applied:**
  1. Removed `getAuthenticatedToken()`, hardcoded credentials, and automated login.
  2. Implemented `signInOperator(email, password, settings)` which takes interactive credentials from the user and stores the session token in `sessionStorage`.
  3. Implemented `getStoredSession()` and `signOutOperator()`.
  4. Updated `getSupabaseHeaders()` to use the session token if signed in, or the public anon key if unauthenticated.

---

## Bug 3: Synthetic $85,000 ARR Multiplier in `pipelineAdapter.ts`

### Severity: HIGH (Data Integrity Defect)
* **Location:** `d:\gtm\src\utils\pipelineAdapter.ts`
* **Description:** In `deriveOpportunitiesFromInboundLogs()`, leads with `route === 'sales_priority'` were assigned a hardcoded deal value of $85,000, and review leads were assigned $45,000:
  ```typescript
  // BEFORE (Fabricated)
  const amount = route === 'sales_priority' ? 85000 : 45000;
  ```
* **Impact:** Fabricated $340k–$520k in unconfirmed sales pipeline on the dashboard.
* **Fix Applied:** Replaced with authentic value from the database:
  ```typescript
  // AFTER (Truthful)
  const amount = Number(log.estimated_annual_revenue) || 0;
  ```
  Deals are clearly labeled as inbound evaluations with unvalued deal amounts until confirmed in CRM.

---

## Bug 4: Fabricated Contact Personas in `pipelineAdapter.ts`

### Severity: HIGH (Data Integrity Defect)
* **Location:** `d:\gtm\src\utils\pipelineAdapter.ts`
* **Description:** `deriveContactsFromAccounts()` matched company domain substrings and generated fictitious personas (`Karri Saarinen`, `Dr. Elena Rostova`, `Marcus Vance`, `Julian Sterling`) with fabricated phone numbers:
  ```typescript
  // BEFORE (Fabricated)
  if (domain.includes('linear')) {
    contactName = 'Karri Saarinen';
    email = 'karri@linear.app';
  } else if (domain.includes('apex')) {
    contactName = 'Dr. Elena Rostova';
    email = 'elena@apexai.tech';
  }
  ```
* **Impact:** Users saw fabricated executive stakeholders not present in the database.
* **Fix Applied:** Replaced function with honest return of empty array:
  ```typescript
  // AFTER (Truthful)
  export function deriveContactsFromAccounts(_accounts: Account[], _currentUser: Member): Contact[] {
    return [];
  }
  ```
  The Contacts page displays an honest empty state until contacts are synced from CRM or entered manually.

---

## Bug 5: Synthetic Execution Telemetry Derivation in `rloe.ts`

### Severity: MEDIUM (Observability Defect)
* **Location:** `d:\gtm\src\services\rloe.ts`
* **Description:** `deriveTelemetryFromInboundLogs()` generated fake execution records with hardcoded latency (2825ms, 92ms), simulated token counts (374, 28), and artificial costs ($0.000129) when direct telemetry queries returned empty under RLS.
* **Fix Applied:** Excised `deriveTelemetryFromInboundLogs()` from the data fetch path. `fetchRloeTelemetry()` returns genuine database records only, or flags `isRestrictedByRls: true` so the UI explains that `rloe_telemetry` is restricted to `service_role` under RLS.

---

## Bug 6: Misleading "Hot Sales Pipeline Velocity" Metric Card

### Severity: MEDIUM (Metric Definition Defect)
* **Location:** `d:\gtm\src\components\RloeMetricsCards.tsx` & `src\context\RloeContext.tsx`
* **Description:** The third KPI card was titled "Hot Sales Pipeline Velocity" and calculated its value as `salesPriorityCount * 85000`.
* **Fix Applied:** Redefined the card as **"Priority Qualified Leads"**:
  - Displays confirmed revenue if available, otherwise displays `${metrics.salesPriorityCount} Qualified`.
  - Subtitle: `4 priority accounts (Deals unvalued)`.
  - Tooltip: Documented that zero synthetic ARR multipliers are applied.

---

## Bug 7: Disconnected Supabase Data in `DataContext.tsx`

### Severity: HIGH (Functional Defect)
* **Location:** `d:\gtm\src\context\DataContext.tsx`
* **Description:** `DataContext` only initialized state from localStorage and static initial data, leaving CRM pages disconnected from Supabase.
* **Fix Applied:** Added synchronization effect reading `inboundLogs` from `useRloe()` and mapping genuine accounts, opportunities, and tasks into React state via `pipelineAdapter.ts`.
