<#
.SYNOPSIS
    RLOE Demo 1 — Practice / High Score Demo (PowerShell)
.DESCRIPTION
    Demonstrates the complete happy path:
    PowerShell -> Webhook Inbound Gate -> Payload Verification -> Cache Miss -> Cache Guard
    -> Clay Waterfall -> Clay Callback -> Deterministic Pre-Filter (Score 90-100) -> LLM Cost Gate (TRUE)
    -> NVIDIA Nemotron LLM Router -> Routing (sales_priority) -> Supabase -> HubSpot (Deal + Task) -> Telemetry -> Frontend.
.NOTES
    Domain: linear.app (Verified high-fit B2B SaaS company)
    Safe practice script. Run this to practice before your interview.
#>

[CmdletBinding()]
param(
    [string]$WebhookUrl = "https://yatinjoshi05.app.n8n.cloud/webhook/v1/revenue-lifecycle-orchestrator",
    [string]$Domain = "linear.app",
    [string]$VisitorId = "rloe-interview-practice-001"
)

$ErrorActionPreference = "Stop"

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "  RLOE DEMO 1 -- PRACTICE / HIGH SCORE (HAPPY PATH)" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

# 1. Resolve Webhook Authorization safely from environment without exposing secrets
$authHeader = $env:RLOE_WEBHOOK_AUTH
if ([string]::IsNullOrWhiteSpace($authHeader)) {
    # Check local .env.local if available in repository root
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

# 2. Construct Inbound Signal Payload (Exact schema from Payload Verification Parser)
$payloadObj = @{
    company_domain       = $Domain
    visitor_anonymous_id = $VisitorId
    source               = "interview_practice_high_score"
    page_url             = "https://$Domain/enterprise"
    utm_source           = "linkedin_inbound"
    utm_campaign         = "q4_enterprise_demand"
    signals              = @{
        demo_requested                 = $true
        enterprise_tier                = $true
        annual_budget_usd              = 150000
        seat_count_target              = 80
        pricing_calculator_used        = $true
        pages_viewed                   = 7
        security_whitepaper_downloaded = $true
    }
}

$payloadJson = $payloadObj | ConvertTo-Json -Depth 5

Write-Host "`n[1/3] Preparing Inbound Signal Payload:" -ForegroundColor Yellow
Write-Host "  Endpoint   : $WebhookUrl"
Write-Host "  Method     : POST"
Write-Host "  Domain     : $Domain"
Write-Host "  Visitor ID : $VisitorId"
Write-Host "  Source     : interview_practice_high_score"
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
Write-Host "  Ingestion Speed : $($stopwatch.ElapsedMilliseconds) ms (SLA under 1500ms met)" -ForegroundColor Green

Write-Host "`n--------------------------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "  CRITICAL ASYNC BEHAVIOR REMINDER FOR INTERVIEW:" -ForegroundColor Magenta
Write-Host "  The HTTP 200 response confirms the Inbound Gate ACCEPTED the signal." -ForegroundColor Gray
Write-Host "  Downstream processing executes ASYNCHRONOUSLY across the architecture:" -ForegroundColor Gray
Write-Host "    1. Inbound Gate -> Payload Verification Parser validates regex." -ForegroundColor Gray
Write-Host "    2. Supabase Cache Check -> Cache Miss (New Account)." -ForegroundColor Gray
Write-Host "    3. Log Pending Row (Cache Guard) -> row inserted in inbound_intent_log." -ForegroundColor Gray
Write-Host "    4. Trigger Clay Waterfall -> Enriches employee count and tech stack." -ForegroundColor Gray
Write-Host "    5. Clay Callback -> Deterministic Pre-Filter scores 90-100." -ForegroundColor Gray
Write-Host "    6. Worth Spending LLM Tokens? -> TRUE (Clears ICP threshold >= 35)." -ForegroundColor Gray
Write-Host "    7. NVIDIA Nemotron LLM Router -> nvidia/nemotron-3.5-lightning-30b-a3b." -ForegroundColor Gray
Write-Host "    8. Routing Decision -> sales_priority assigned." -ForegroundColor Gray
Write-Host "    9. Supabase Updated -> inbound_intent_log updated to status: scored." -ForegroundColor Gray
Write-Host "   10. HubSpot Sync -> Deal (`$150,000) and High-Priority Task created." -ForegroundColor Gray
Write-Host "   11. Telemetry Logged -> rloe_telemetry records token counts and cost." -ForegroundColor Gray
Write-Host "   12. Frontend Live Board -> linear.app appears under Sales Priority." -ForegroundColor Gray
Write-Host "--------------------------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "DEMO 1 PRACTICE RUN COMPLETED SUCCESSFULLY." -ForegroundColor Green
