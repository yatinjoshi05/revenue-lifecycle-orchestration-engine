import { Opportunity, Account, Stage, stages } from '../types/crm';

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCloseDate(dateStr?: string | null): string {
  return dateStr
    ? new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No close date';
}

export const opportunityColumns: Record<string, string> = {
  account: 'Account',
  stage: 'Stage',
  amount: 'Amount',
  owner: 'Owner',
  closeDate: 'Close date',
  nextStep: 'Next step',
};

export function filterAndSortOpportunities(
  opps: Opportunity[],
  accounts: Account[],
  params: {
    q?: string;
    stage?: string;
    account?: string;
    owner?: string;
    sort?: string;
    direction?: 'asc' | 'desc';
  }
): Opportunity[] {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const q = (params.q || '').trim().toLowerCase();
  const stage = params.stage;
  const accountId = params.account;
  const owner = params.owner;
  const sort = params.sort || 'name';
  const isDesc = params.direction === 'desc';

  let filtered = opps.filter((opp) => {
    if (q) {
      const matchName = opp.name.toLowerCase().includes(q);
      const matchAccount = (accountMap.get(opp.accountId) || '').toLowerCase().includes(q);
      const matchNextStep = (opp.nextStep || '').toLowerCase().includes(q);
      const matchOwner = (opp.owner?.name || '').toLowerCase().includes(q);
      if (!matchName && !matchAccount && !matchNextStep && !matchOwner) {
        return false;
      }
    }

    if (stage && opp.stage !== stage) return false;
    if (accountId && opp.accountId !== accountId) return false;
    if (owner) {
      if (owner === 'unassigned') {
        if (opp.owner && opp.owner.name) return false;
      } else {
        if (opp.owner?.id !== owner) return false;
      }
    }

    return true;
  });

  filtered.sort((a, b) => {
    let comparison = 0;
    if (sort === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sort === 'amount') {
      comparison = (a.amount || 0) - (b.amount || 0);
    } else if (sort === 'closeDate') {
      comparison = (a.closeDate || '').localeCompare(b.closeDate || '');
    } else if (sort === 'updatedAt') {
      comparison = (a.updatedAt || '').localeCompare(b.updatedAt || '');
    } else if (sort === 'stage') {
      const aIdx = stages.indexOf(a.stage);
      const bIdx = stages.indexOf(b.stage);
      comparison = aIdx - bIdx;
    } else if (sort === 'account') {
      const aAcc = accountMap.get(a.accountId) || '';
      const bAcc = accountMap.get(b.accountId) || '';
      comparison = aAcc.localeCompare(bAcc);
    } else if (sort === 'owner') {
      const aOwner = a.owner?.name || '';
      const bOwner = b.owner?.name || '';
      comparison = aOwner.localeCompare(bOwner);
    }
    return isDesc ? -comparison : comparison;
  });

  return filtered;
}
