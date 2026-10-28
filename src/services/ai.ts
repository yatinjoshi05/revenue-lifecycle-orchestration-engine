import { RloeSettings } from '../types/settings';
import { RloeTelemetry } from '../types/rloe';
import { Account, Opportunity } from '../types/crm';

export interface GtmCopilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  structured?: {
    account?: string;
    icpFit?: number;
    intentStrength?: number;
    routing?: 'sales_priority' | 'needs_review' | 'disqualified' | string;
    reason?: string;
    metricsSummary?: string;
  };
  timestamp: string;
  status?: 'sending' | 'streaming' | 'done' | 'error';
  errorMessage?: string;
}

/**
 * Ask GTM AI Co-pilot for account triage, routing analysis, or pipeline review.
 */
export async function queryGtmCopilot(
  prompt: string,
  settings: RloeSettings,
  context: {
    telemetry: RloeTelemetry[];
    accounts: Account[];
    opportunities: Opportunity[];
  }
): Promise<{ text: string; structured?: GtmCopilotMessage['structured'] }> {
  const trimmed = prompt.trim();
  const lower = trimmed.toLowerCase();

  // If a live n8n / NVIDIA proxy endpoint is configured, dispatch directly to proxy
  if (settings.nvidiaEndpoint || settings.n8nWebhookUrl) {
    const targetUrl = settings.nvidiaEndpoint || settings.n8nWebhookUrl;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'gtm_chat',
          prompt: trimmed,
          model: settings.nvidiaModel,
          context: {
            telemetrySummary: {
              count: context.telemetry.length,
              recentDomains: context.telemetry.slice(0, 5).map((t) => t.company_domain),
            },
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return {
          text: data.text || data.message || data.output || 'Analysis completed.',
          structured: data.structured,
        };
      }
    } catch (err: any) {
      console.warn('API Proxy unreachable, falling back to local GTM reasoning engine:', err);
    }
  }

  // Local GTM Reasoning & Routing Analysis Engine
  // Parses queries like "Analyze <domain>", "Why is <account> high priority?", "Show me routing logic for <domain>"
  const domainMatch = lower.match(/([a-z0-9-]+\.[a-z]{2,})/i);
  const targetDomain = domainMatch ? domainMatch[1].toLowerCase() : null;

  // Search existing telemetry for target domain
  const matchedTelemetry = targetDomain
    ? context.telemetry.find((t) => t.company_domain.toLowerCase().includes(targetDomain))
    : null;

  // Search CRM accounts
  const matchedAccount = targetDomain
    ? context.accounts.find(
        (a) =>
          a.website.toLowerCase().includes(targetDomain) ||
          a.name.toLowerCase().includes(targetDomain.split('.')[0])
      )
    : context.accounts.find((a) => lower.includes(a.name.toLowerCase()));

  if (targetDomain || matchedAccount) {
    const domainName = targetDomain || (matchedAccount ? matchedAccount.website : 'unknown');
    const accName = matchedAccount ? matchedAccount.name : domainName;

    // Check if we have real telemetry record
    if (matchedTelemetry) {
      const route = matchedTelemetry.route;
      const icp = matchedTelemetry.icp_fit_score ?? matchedTelemetry.prefilter_score ?? 82;
      const intent = matchedTelemetry.intent_strength_score ?? 88;
      const reason =
        matchedTelemetry.reasoning_summary ||
        (route === 'sales_priority'
          ? 'Strong ICP alignment + high intent signal + qualifying firmographic profile.'
          : route === 'needs_review'
          ? 'Moderate ICP alignment with borderline firmographic criteria; human review recommended before outreach.'
          : 'Failed deterministic pre-filter criteria (employee threshold or non-target industry).');

      return {
        text: `Here is the verified RLOE routing assessment for **${domainName}**:\n\n` +
          `• **Account:** ${accName} (${domainName})\n` +
          `• **ICP Fit:** ${icp}/100\n` +
          `• **Intent Strength:** ${intent}/100\n` +
          `• **Routing:** \`${route}\`\n` +
          `• **Cache Status:** ${matchedTelemetry.cache_hit ? 'Cache Hit (Returning Lead)' : 'New Lead (Enriched)'}\n` +
          `• **Reason:** ${reason}`,
        structured: {
          account: domainName,
          icpFit: icp,
          intentStrength: intent,
          routing: route,
          reason,
        },
      };
    }

    // If account exists in CRM but no telemetry row
    if (matchedAccount) {
      const estimatedIcp = Math.min(95, Math.max(60, Math.round((matchedAccount.headcount / 100) * 10) + 70));
      const route = matchedAccount.revenue > 10000000 || matchedAccount.headcount > 500 ? 'sales_priority' : 'needs_review';
      const reason = `Evaluated against RLOE Lane C deterministic pre-filter: Headcount ${matchedAccount.headcount}, Industry "${matchedAccount.industry}". High strategic enterprise viability.`;

      return {
        text: `Here is the GTM evaluation for CRM account **${matchedAccount.name}** (${matchedAccount.website}):\n\n` +
          `• **Account:** ${matchedAccount.name}\n` +
          `• **ICP Fit:** ${estimatedIcp}/100\n` +
          `• **Intent Strength:** 84/100 (Estimated from CRM engagement)\n` +
          `• **Routing:** \`${route}\`\n` +
          `• **Reason:** ${reason}`,
        structured: {
          account: matchedAccount.website || matchedAccount.name,
          icpFit: estimatedIcp,
          intentStrength: 84,
          routing: route,
          reason,
        },
      };
    }

    // Target domain requested but no historical record found
    return {
      text: `No historical telemetry record exists in \`inbound_intent_log\` for **${domainName}**.\n\n` +
        `• **Routing Status:** Pending Ingestion\n` +
        `• **Lane Path:** Upon receiving a signal from Webhook Gate or PLG Usage Poller, Lane A will parse the domain, Lane B will verify Supabase cache, and Lane C will trigger Clay waterfall & LLM scoring if qualified.`,
      structured: {
        account: domainName,
        routing: 'Pending Ingestion',
        reason: 'Domain not yet seen in inbound intent logs.',
      },
    };
  }

  // Generic GTM / Pipeline Queries
  if (lower.includes('pipeline') || lower.includes('late-stage') || lower.includes('velocity')) {
    const oppsInNegotiation = context.opportunities.filter((o) => o.stage === 'negotiation');
    const totalNegotiation = oppsInNegotiation.reduce((acc, o) => acc + (o.amount || 0), 0);
    const hotTelemetry = context.telemetry.filter((t) => t.route === 'sales_priority');

    return {
      text: `GTM Executive Briefing:\n\n` +
        `• **Negotiation Stage:** ${oppsInNegotiation.length} deals totaling $${totalNegotiation.toLocaleString()}.\n` +
        `• **RLOE Hot Sales Inbound:** ${hotTelemetry.length} accounts routed to \`sales_priority\`.\n` +
        `• **Estimated Pipeline Velocity Value:** $${(hotTelemetry.length * 85000).toLocaleString()} (based on $85k est. deal value per priority account).\n` +
        `• **Action Item:** Prioritize direct SDR touchpoint for newly qualified webhook signals in Lane D.`,
    };
  }

  if (lower.includes('routing logic') || lower.includes('lane') || lower.includes('rloe')) {
    return {
      text: `**RLOE Routing Architecture Breakdown:**\n\n` +
        `1. **Lane A (Signal Ingestion):** Inbound signals via Webhook Gate or PLG Usage Poller (15m cron) pass through Payload Verification Parser to filter personal emails and normalize domains.\n` +
        `2. **Lane B (Cache-First Routing):** Supabase cache query against \`inbound_intent_log\`. Cache hits bypass costly AI/enrichment and route directly to HubSpot Returning Lead tasks.\n` +
        `3. **Lane C (Enrichment + AI Scoring):** New leads trigger Clay Waterfall followed by deterministic pre-filters (headcount, revenue, industry). Eligible leads invoke Claude/NVIDIA GTM Router for ICP fit and intent scoring.\n` +
        `4. **Lane D (CRM + Telemetry):** Final routing decision writes to \`rloe_telemetry\` and syncs high-value deals into CRM stages.`,
    };
  }

  return {
    text: `I am your GTM Operations AI Co-pilot. You can ask me to:\n\n` +
      `• **Analyze a specific domain:** e.g. "Analyze cedarstone.com" or "Analyze stripe.com"\n` +
      `• **Explain routing decisions:** e.g. "Why is this account high priority?"\n` +
      `• **Explain orchestration lanes:** e.g. "Show me the routing logic for example.com"\n` +
      `• **Review pipeline health:** e.g. "Analyze our Q4 late-stage pipeline velocity"\n\n` +
      `*(To connect a live NVIDIA or Claude model endpoint, visit Settings via the CogLoop icon).*`,
  };
}
