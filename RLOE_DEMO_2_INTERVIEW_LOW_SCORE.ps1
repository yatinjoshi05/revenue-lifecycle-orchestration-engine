<#
.SYNOPSIS
    RLOE Demo 2 — Interview / Low Score Demo (PowerShell)
.DESCRIPTION
    Demonstrates cost control and deterministic pre-filtering:
    PowerShell -> Webhook Inbound Gate -> Payload Verification -> Cache Miss -> Cache Guard
    -> Clay Waterfall -> Clay Callback (Retail / Low Headcount) -> Deterministic Pre-Filter (< 35 points)
    -> Worth Spending LLM Tokens? (FALSE) -> NVIDIA Nemotron is SKIPPED (0 tokens spent, $0 cost)
    -> Routing Decision (disqualified) -> Supabase Updated -> HubSpot Bypassed (Zero noise)
    -> Telemetry Logged (outcome: skipped_llm_prefilter) -> Frontend Live Reflection.
.NOTES
    Domain: mikesbakerynyc.com (Verified low-fit local retail bakery)
    PRESERVED UNTOUCHED FOR INTERVIEW. Do not run unnecessarily during practice.
#>

[CmdletBinding()]
param(
    [string]$WebhookUrl = "https://yatinjoshi05.app.n8n.cloud/webhook/v1/revenue-lifecycle-orchestrator",
    [string]$Domain = "mikesbakerynyc.com",
    [string]$VisitorId = "interview-low-score-visitor-002"
)

$ErrorActionPreference = "Stop"

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "  RLOE DEMO 2 -- INTERVIEW / LOW SCORE (COST CONTROL)" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

# 1. Resolve Webhook Authorization safely from environment without exposing secrets
$authHeader = $env:RLOE_WEBHOOK_AUTH
if ([string]::IsNullOrWhiteSpace($authHeader)) {
    $envFile = Join-Path $PSScriptRoot ".env.local"
    if (-not (Test-Path $envFile)) {
        $envFile = Join-Path (Split-Path $PSScriptRoot -Parent) ".env.local"
    }
    if (Test-Path $envFile) {
        $match = Get-Content $envFile | Select-String "^N8N_AUTH_HEADER_VALUE=(.*)$"
        if ($match) {
            $authHeader = $match.Matches[0].Groups[1].Value.Trim().Trim('"').Trim("'")
        }
    }
}

if ([string]::IsNullOrWhiteSpace($authHeader)) {
    Write-Warning "No authorization token found in `$env:RLOE_WEBHOOK_AUTH or .env.local."
    Write-Warning "Set `$env:RLOE_WEBHOOK_AUTH = '<your-token>' before running if authentication is required."
}

# 2. Construct Low-Score Inbound Signal Payload
$payloadObj = @{
    company_domain       = $Domain
    visitor_anonymous_id = $VisitorId
    source               = "interview_demo_low_score"
    page_url             = "https://$Domain/recipes/sourdough-tips"
    utm_source           = "organic_search"
    utm_campaign         = "top_of_funnel_blog"
    signals              = @{
        demo_requested            = $false
        enterprise_tier           = $false
        pages_viewed              = 1
        bounced_after_single_view = $true
    }
}

$payloadJson = $payloadObj | ConvertTo-Json -Depth 5

Write-Host "`n[1/3] Preparing Low-Score Signal Payload:" -ForegroundColor Yellow
Write-Host "  Endpoint   : $WebhookUrl"
Write-Host "  Method     : POST"
Write-Host "  Domain     : $Domain"
Write-Host "  Visitor ID : $VisitorId"
Write-Host "  Source     : interview_demo_low_score"
Write-Host "  Auth Header: [CONFIGURED - SECURELY MASKED]" -ForegroundColor DarkGray

Write-Host "`nPayload JSON:" -ForegroundColor DarkGray
Write-Host $payloadJson -ForegroundColor DarkGray

# 3. Dispatch Inbound Request
Write-Host "`n[2/3] Dispatching HTTP POST to Webhook Inbound Gate..." -ForegroundColor Yellow
$headers = @{
    "Content-Type" = "application/json"
}
if (-not [string]::IsNullOrWhiteSpace($authHeader)) {
    $headers["Authorization"] = $authHeader
}

$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
try {
    $response = Invoke-RestMethod -Uri $WebhookUrl -Method Post -Headers $headers -Body $payloadJson -TimeoutSec 15
    $stopwatch.Stop()
    $statusCode = 200
} catch {
    $stopwatch.Stop()
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
        Write-Error "Webhook returned HTTP $statusCode`: $($_.Exception.Message)"
    } else {
        Write-Error "Request failed`: $($_.Exception.Message)"
    }
    exit 1
}

# 4. Display Real Asynchronous Receipt Status
Write-Host "`n[3/3] Inbound Gate Result:" -ForegroundColor Green
Write-Host "  HTTP Status     : $statusCode OK" -ForegroundColor Green
Write-Host "  Ingestion Speed : $($stopwatch.ElapsedMilliseconds) ms" -ForegroundColor Green

Write-Host "`n--------------------------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "  COST CONTROL AND DOWNSTREAM VERIFICATION CHECKS:" -ForegroundColor Magenta
Write-Host "  1. Clay returns retail business profile (under 10 employees, non-tech industry)." -ForegroundColor Gray
Write-Host "  2. Deterministic Pre-Filter calculates score under 35 (below ICP threshold)." -ForegroundColor Gray
Write-Host "  3. Worth Spending LLM Tokens? evaluates to FALSE." -ForegroundColor Gray
Write-Host "  4. NVIDIA Nemotron router is 100% BYPASSED (0 tokens consumed, `$0 cost)." -ForegroundColor Gray
Write-Host "  5. Supabase inbound_intent_log updated to status: disqualified." -ForegroundColor Gray
Write-Host "  6. Supabase rloe_telemetry records outcome: skipped_llm_prefilter." -ForegroundColor Gray
Write-Host "  7. ZERO HubSpot deals or tasks created (Sales reps focus only on qualified)." -ForegroundColor Gray
Write-Host "--------------------------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "DEMO 2 DISPATCH COMPLETED. VERIFY TELEMETRY TABLE IN SUPABASE." -ForegroundColor Green
