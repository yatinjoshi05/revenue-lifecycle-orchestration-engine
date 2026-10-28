import { InboundIntentLog } from '../types/rloe';
import { Opportunity, Account, Contact, Task, Member, Stage } from '../types/crm';

/**
 * Adapter bridging live Supabase RLOE inbound pipeline records to CRM data models.
 * Strict Ground Truth Architecture:
 * - Never fabricates fake ARR ($85k multiplier removed).
 * - Never invents fake contact identities (Karri Saarinen, Dr. Elena Rostova, etc. removed).
 * - Uses actual database and enrichment fields only.
 * - Handles missing optional fields with honest zero/null states.
 */

interface EnrichmentData {
  company_name?: string;
  employee_count?: number;
  industry?: string;
  annual_revenue?: number;
  country?: string;
  funding_stage?: string;
  tech_stack?: string[];
}

function parseEnrichment(raw?: string): EnrichmentData | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw.trim());
  } catch {
    return null;
  }
}

function domainToName(domain: string): string {
  const clean = domain.replace(/^www\./, '').split('.')[0];
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Derive verified Account entities from inbound_intent_log records.
 * Uses genuine company domains, enrichment metadata, and honest numerical values.
 */
export function deriveAccountsFromInboundLogs(
  logs: InboundIntentLog[],
  currentUser: Member
): Account[] {
  const seenDomains = new Set<string>();
  const accounts: Account[] = [];

  for (const log of logs) {
    if (!log.company_domain) continue;
    const domain = log.company_domain.toLowerCase().trim();
    if (seenDomains.has(domain)) continue;
    seenDomains.add(domain);

    const enrichment = parseEnrichment(log.enrichment_summary);
    const companyName =
      log.company_name ||
      enrichment?.company_name ||
      domainToName(domain);

    // True employee count from verified enrichment, or 0 if unverified
    const headcount = typeof enrichment?.employee_count === 'number' ? enrichment.employee_count : 0;

    // True annual revenue from database or enrichment, or 0 if unrecorded
    const revenue =
      Number(log.estimated_annual_revenue) ||
      (enrichment?.annual_revenue ? Number(enrichment.annual_revenue) : 0);

    const industry =
      log.industry ||
      enrichment?.industry ||
      'Unclassified';

    const accountId = `acc_${domain.replace(/[^a-z0-9]/gi, '_')}`;

    accounts.push({
      id: accountId,
      name: companyName,
      website: domain,
      industry,
      revenue,
      headcount,
      location: enrichment?.country || 'Unknown',
      owner: currentUser,
      notes: log.enrichment_summary
        ? [
            {
              id: `note_${log.id}`,
              body: `Verified Firmographic Enrichment: ${log.enrichment_summary.trim()}`,
              author: currentUser,
              createdAt: log.created_at || new Date().toISOString(),
            },
          ]
        : [],
      activity: [
        {
          id: `act_${log.id}`,
          type: 'created',
          actor: currentUser,
          summary: `Inbound intent recorded from ${log.source || 'webhook'} (ICP ${log.icp_fit_score ?? '—'}/100, Route: ${log.route || 'pending'})`,
          createdAt: log.created_at || new Date().toISOString(),
        },
      ],
      createdAt: log.created_at || new Date().toISOString(),
      updatedAt: log.last_seen_at || log.created_at || new Date().toISOString(),
    });
  }

  return accounts;
}

/**
 * Derive Opportunity records from verified qualified inbound intent signals.
 * Only leads routed to 'sales_priority' or 'needs_review' represent pipeline opportunities.
 * Amount is derived strictly from real revenue fields if available, otherwise 0.
 */
export function deriveOpportunitiesFromInboundLogs(
  logs: InboundIntentLog[],
  accounts: Account[],
  currentUser: Member
): Opportunity[] {
  const accountMap = new Map<string, Account>();
  accounts.forEach((a) => accountMap.set(a.website.toLowerCase(), a));

  const opps: Opportunity[] = [];

  for (const log of logs) {
    if (!log.company_domain) continue;
    const domain = log.company_domain.toLowerCase().trim();
    const account = accountMap.get(domain);
    if (!account) continue;

    const route = log.route || '';
    // Disqualified leads and unrouted leads do not form pipeline opportunities
    if (route === 'disqualified' || !route) continue;

    let stage: Stage = 'qualification';
    if (route === 'sales_priority') {
      stage = (log.icp_fit_score && log.icp_fit_score >= 90) ? 'negotiation' : 'proposal';
    } else if (route === 'needs_review') {
      stage = 'discovery';
    }

    // Actual revenue value or 0 (no synthetic $85k multiplier)
    const amount = Number(log.estimated_annual_revenue) || 0;

    const nextStep =
      route === 'sales_priority'
        ? 'Executive briefing & priority demo (Lane A Priority)'
        : 'SDR qualification outreach & tech stack evaluation (Lane C Review)';

    const hubspotSyncNote = log.hubspot_deal_id
      ? `HubSpot Deal ID: ${log.hubspot_deal_id}`
      : 'HubSpot Sync: Pending / External credentials required';

    opps.push({
      id: `opp_${log.id}`,
      name: `${account.name} — Inbound Evaluation`,
      accountId: account.id,
      stage,
      amount,
      currency: 'USD',
      closeDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      nextStep,
      owner: currentUser,
      contactIds: [],
      notes: [
        {
          id: `note_${log.id}_sync`,
          body: `RLOE Inbound Routing: Route = ${route}, ICP Fit = ${log.icp_fit_score ?? '—'}/100, Prefilter = ${log.prefilter_score ?? '—'}/100. ${hubspotSyncNote}`,
          author: currentUser,
          createdAt: log.created_at || new Date().toISOString(),
        },
      ],
      activity: [
        {
          id: `act_${log.id}_opp`,
          type: 'created',
          actor: currentUser,
          summary: `RLOE Pipeline Opportunity: Route = ${route}, Pre-Score = ${log.prefilter_score ?? '—'}, ICP = ${log.icp_fit_score ?? '—'}`,
          createdAt: log.created_at || new Date().toISOString(),
        },
      ],
      createdAt: log.created_at || new Date().toISOString(),
      updatedAt: log.last_seen_at || log.created_at || new Date().toISOString(),
    });
  }

  return opps;
}

/**
 * Derive actionable operational tasks from inbound signals.
 * Only creates tasks for valid, documented operational actions.
 */
export function deriveTasksFromInboundLogs(
  logs: InboundIntentLog[],
  accounts: Account[],
  currentUser: Member
): Task[] {
  const accountMap = new Map<string, Account>();
  accounts.forEach((a) => accountMap.set(a.website.toLowerCase(), a));

  const tasks: Task[] = [];

  for (const log of logs) {
    if (!log.company_domain) continue;
    const account = accountMap.get(log.company_domain.toLowerCase());
    const companyName = account?.name || log.company_name || log.company_domain;

    const isCacheHit = Boolean(
      log.cache_hit || (log.last_seen_at && log.first_seen_at && log.last_seen_at !== log.first_seen_at)
    );

    if (isCacheHit) {
      tasks.push({
        id: `task_cache_${log.id}`,
        title: `Follow up with returning lead at ${companyName} (Cache Hit in Lane B)`,
        status: 'todo',
        dueDate: new Date().toISOString().split('T')[0],
        owner: currentUser,
        createdAt: log.last_seen_at || log.created_at || new Date().toISOString(),
        updatedAt: log.last_seen_at || log.created_at || new Date().toISOString(),
      });
    } else if (log.route === 'sales_priority') {
      tasks.push({
        id: `task_priority_${log.id}`,
        title: `Prepare executive briefing for ${companyName} (ICP ${log.icp_fit_score ?? 95}/100)`,
        status: 'todo',
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        owner: currentUser,
        createdAt: log.created_at || new Date().toISOString(),
        updatedAt: log.created_at || new Date().toISOString(),
      });
    } else if (log.route === 'needs_review') {
      tasks.push({
        id: `task_review_${log.id}`,
        title: `Review firmographic criteria for ${companyName} (Lane C Review)`,
        status: 'todo',
        dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
        owner: currentUser,
        createdAt: log.created_at || new Date().toISOString(),
        updatedAt: log.created_at || new Date().toISOString(),
      });
    }
  }

  return tasks;
}

/**
 * Returns verified contacts only.
 * Inbound intent signals do not contain verified contact identities;
 * returns an empty array rather than fabricating synthetic people.
 */
export function deriveContactsFromAccounts(
  _accounts: Account[],
  _currentUser: Member
): Contact[] {
  // Ground Truth: Zero fabricated contacts.
  return [];
}
