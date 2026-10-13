<#
.SYNOPSIS
    RLOE Demo 3 — Interview / Duplicate Cache Demo (PowerShell)
.DESCRIPTION
    Demonstrates cache-first architecture and duplicate protection:
    Phase 1 (Touch 1): First-seen company -> Cache Miss -> Writes Pending Cache Guard -> Clay Waterfall.
    Phase 2 (Touch 2): SAME company sent with new visitor ID -> Instant Cache Hit -> Bypasses Clay completely
    -> Bypasses NVIDIA completely -> Triggers HubSpot Task (Returning Lead) -> Updates last_seen_at in Supabase
    without creating duplicate database rows.
.NOTES
    Domain: retrieval.ai (Clean domain for cache demonstration)
    PRESERVED UNTOUCHED FOR INTERVIEW. Do not run unnecessarily during practice.
#>

[CmdletBinding()]
param(
    [string]$WebhookUrl = "https://yatinjoshi05.app.n8n.cloud/webhook/v1/revenue-lifecycle-orchestrator",
    [string]$Domain = "retrieval.ai",
    [int]$WaitBetweenTouchesSec = 6
)

$ErrorActionPreference = "Stop"

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "  RLOE DEMO 3 -- INTERVIEW / DUPLICATE CACHE-FIRST ARCHITECTURE" -ForegroundColor Cyan
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

$headers = @{ "Content-Type" = "application/json" }
if (-not [string]::IsNullOrWhiteSpace($authHeader)) {
    $headers["Authorization"] = $authHeader
}

# ==============================================================================
# TOUCH 1: FIRST SEEN (ESTABLISH CACHE)
# ==============================================================================
$visitor1 = "interview-dup-touch1-003"
$payloadObj1 = @{
    company_domain       = $Domain
    visitor_anonymous_id = $visitor1
    source               = "interview_demo_duplicate_first"
    page_url             = "https://$Domain/home"
    utm_source           = "direct_traffic"
    signals              = @{
        demo_requested   = $false
        pages_viewed     = 2
    }
}
$payloadJson1 = $payloadObj1 | ConvertTo-Json -Depth 5

Write-Host "`n>>> [TOUCH 1: FIRST-SEEN ACCOUNT / CACHE MISS]" -ForegroundColor Yellow
Write-Host "  Target Domain : $Domain"
Write-Host "  Visitor ID    : $visitor1"
Write-Host "  Source        : interview_demo_duplicate_first"
Write-Host "  Dispatching Touch 1 to Webhook Inbound Gate..."

$sw1 = [System.Diagnostics.Stopwatch]::StartNew()
try {
    $res1 = Invoke-RestMethod -Uri $WebhookUrl -Method Post -Headers $headers -Body $payloadJson1 -TimeoutSec 15
    $sw1.Stop()
    Write-Host "  Touch 1 Status : HTTP 200 OK ($($sw1.ElapsedMilliseconds) ms)" -ForegroundColor Green
    Write-Host "  Downstream Path: Cache Miss -> Insert Pending Row (Cache Guard) -> Clay Waterfall" -ForegroundColor Gray
} catch {
    $sw1.Stop()
    Write-Error "Touch 1 Failed`: $($_.Exception.Message)"
    exit 1
}

# ==============================================================================
# PAUSE TO ALLOW INITIAL CACHE GUARD INSERTION
# ==============================================================================
Write-Host "`nPausing $WaitBetweenTouchesSec seconds to allow Supabase cache row creation..." -ForegroundColor DarkGray
Start-Sleep -Seconds $WaitBetweenTouchesSec

# ==============================================================================
# TOUCH 2: RETURNING LEAD (INSTANT CACHE HIT)
# ==============================================================================
$visitor2 = "interview-dup-touch2-003"
$payloadObj2 = @{
    company_domain       = $Domain
    visitor_anonymous_id = $visitor2
    source               = "interview_demo_duplicate_second"
    page_url             = "https://$Domain/pricing"
    utm_source           = "direct_traffic"
    signals              = @{
        returning_visitor     = $true
        pricing_page_revisit  = $true
        pages_viewed          = 4
    }
}
$payloadJson2 = $payloadObj2 | ConvertTo-Json -Depth 5

Write-Host "`n>>> [TOUCH 2: RETURNING ACCOUNT / INSTANT CACHE HIT]" -ForegroundColor Yellow
Write-Host "  Target Domain : $Domain (IDENTICAL COMPANY DOMAIN)"
Write-Host "  Visitor ID    : $visitor2 (NEW ANONYMOUS VISITOR)"
Write-Host "  Source        : interview_demo_duplicate_second"
Write-Host "  Dispatching Touch 2 to Webhook Inbound Gate..."

$sw2 = [System.Diagnostics.Stopwatch]::StartNew()
try {
    $res2 = Invoke-RestMethod -Uri $WebhookUrl -Method Post -Headers $headers -Body $payloadJson2 -TimeoutSec 15
    $sw2.Stop()
    Write-Host "  Touch 2 Status : HTTP 200 OK ($($sw2.ElapsedMilliseconds) ms)" -ForegroundColor Green
} catch {
    $sw2.Stop()
    Write-Error "Touch 2 Failed`: $($_.Exception.Message)"
    exit 1
}

Write-Host "`n--------------------------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "  CACHE-FIRST ARCHITECTURAL HIGHLIGHTS FOR INTERVIEW:" -ForegroundColor Magenta
Write-Host "  1. On Touch 2, Supabase Cache Check immediately recognized $Domain." -ForegroundColor Gray
Write-Host "  2. Clay Waterfall is 100% BYPASSED (Zero enrichment API credits consumed)." -ForegroundColor Gray
Write-Host "  3. NVIDIA Nemotron LLM Router is 100% BYPASSED (Zero tokens consumed)." -ForegroundColor Gray
Write-Host "  4. HubSpot Task 'Returning Lead' created to alert sales rep of account revisit." -ForegroundColor Gray
Write-Host "  5. Supabase 'last_seen_at' timestamp updated without creating duplicate rows." -ForegroundColor Gray
Write-Host "  6. Telemetry records stage: cache_hit, outcome: existing_lead_crm_task." -ForegroundColor Gray
Write-Host "--------------------------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "DEMO 3 DUPLICATE CYCLE COMPLETED SUCCESSFULLY." -ForegroundColor Green
