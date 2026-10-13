import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  X,
  Search,
  Globe,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowUpDown,
  Filter,
  Trash2,
  Handshake,
  ShieldAlert,
  AlertCircle,
  ExternalLink,
  PieChart,
} from 'lucide-react';
import { Header } from '../components/Header';
import { useCRM } from '../context/DataContext';
import { formatMoney } from '../utils/format';
import { Account } from '../types/crm';

interface AccountsPageProps {
  onToggleMobileSidebar: () => void;
  onOpenSettings?: () => void;
}

const COMMON_INDUSTRIES = [
  'Enterprise SaaS',
  'FinTech',
  'Healthcare & Life Sciences',
  'Logistics & Supply Chain',
  'Cybersecurity',
  'E-Commerce & Retail',
  'Infrastructure',
  'Other',
];

export const AccountsPage: React.FC<AccountsPageProps> = ({
  onToggleMobileSidebar,
  onOpenSettings,
}) => {
  const { accounts, opportunities, contacts, createAccount, deleteAccount } = useCRM();

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('ALL');
  const [coverageFilter, setCoverageFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'revenue' | 'headcount' | 'pipeline' | 'contacts'>('revenue');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('Enterprise SaaS');
  const [revenue, setRevenue] = useState('');
  const [headcount, setHeadcount] = useState('');
  const [location, setLocation] = useState('');

  // Precomputed account maps for speed
  const accountContactsCount = useMemo(() => {
    const map = new Map<string, number>();
    contacts.forEach((c) => {
      if (c.accountId) {
        map.set(c.accountId, (map.get(c.accountId) || 0) + 1);
      }
    });
    return map;
  }, [contacts]);

  const accountOpportunities = useMemo(() => {
    const countMap = new Map<string, number>();
    const amountMap = new Map<string, number>();
    opportunities.forEach((o) => {
      if (o.accountId) {
        countMap.set(o.accountId, (countMap.get(o.accountId) || 0) + 1);
        amountMap.set(o.accountId, (amountMap.get(o.accountId) || 0) + (o.amount || 0));
      }
    });
    return { countMap, amountMap };
  }, [opportunities]);

  // Real KPIs calculation
  const totalAccounts = accounts.length;
  const totalRevenue = accounts.reduce((sum, a) => sum + (a.revenue || 0), 0);
  const totalPipeline = opportunities.reduce((sum, o) => sum + (o.amount || 0), 0);

  const accountsWithOpps = accounts.filter((a) => (accountOpportunities.countMap.get(a.id) || 0) > 0);
  const accountsWithoutContacts = accounts.filter((a) => (accountContactsCount.get(a.id) || 0) === 0);
  const accountsWithWebsite = accounts.filter((a) => !!a.website && a.website.trim().length > 0);
  const accountsWithOwner = accounts.filter((a) => !!a.owner?.name);

  const contactCoveragePct = totalAccounts > 0 ? Math.round(((totalAccounts - accountsWithoutContacts.length) / totalAccounts) * 100) : 0;
  const pipelineCoveragePct = totalAccounts > 0 ? Math.round((accountsWithOpps.length / totalAccounts) * 100) : 0;
  const websiteCoveragePct = totalAccounts > 0 ? Math.round((accountsWithWebsite.length / totalAccounts) * 100) : 0;
  const ownerCoveragePct = totalAccounts > 0 ? Math.round((accountsWithOwner.length / totalAccounts) * 100) : 0;

  // Industry distribution calculation
  const industryDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    accounts.forEach((a) => {
      const ind = a.industry || 'General';
      counts[ind] = (counts[ind] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [accounts]);

  // Operational GTM Gaps (derived strictly from real data)
  const uncoveredAccounts = useMemo(() => {
    return accounts.filter((a) => (accountContactsCount.get(a.id) || 0) === 0);
  }, [accounts, accountContactsCount]);

  const pipelineGapAccounts = useMemo(() => {
    return accounts.filter((a) => (accountOpportunities.countMap.get(a.id) || 0) === 0);
  }, [accounts, accountOpportunities]);

  const missingWebsiteAccounts = useMemo(() => {
    return accounts.filter((a) => !a.website || a.website.trim().length === 0);
  }, [accounts]);

  // Filtered and sorted accounts
  const filteredAccounts = useMemo(() => {
    return accounts
      .filter((a) => {
        // Search
        const searchLower = search.toLowerCase();
        const matchesSearch =
          !search ||
          a.name.toLowerCase().includes(searchLower) ||
          a.website.toLowerCase().includes(searchLower) ||
          a.industry.toLowerCase().includes(searchLower) ||
          (a.owner?.name && a.owner.name.toLowerCase().includes(searchLower));

        if (!matchesSearch) return false;

        // Industry filter
        if (industryFilter !== 'ALL' && a.industry !== industryFilter) {
          return false;
        }

        // Coverage filter
        if (coverageFilter === 'NO_CONTACTS' && (accountContactsCount.get(a.id) || 0) > 0) return false;
        if (coverageFilter === 'HAS_CONTACTS' && (accountContactsCount.get(a.id) || 0) === 0) return false;
        if (coverageFilter === 'HAS_OPPS' && (accountOpportunities.countMap.get(a.id) || 0) === 0) return false;
        if (coverageFilter === 'NO_OPPS' && (accountOpportunities.countMap.get(a.id) || 0) > 0) return false;
        if (coverageFilter === 'NO_WEBSITE' && !!a.website) return false;

        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'name') {
          cmp = a.name.localeCompare(b.name);
        } else if (sortBy === 'revenue') {
          cmp = (a.revenue || 0) - (b.revenue || 0);
        } else if (sortBy === 'headcount') {
          cmp = (a.headcount || 0) - (b.headcount || 0);
        } else if (sortBy === 'pipeline') {
          const pipeA = accountOpportunities.amountMap.get(a.id) || 0;
          const pipeB = accountOpportunities.amountMap.get(b.id) || 0;
          cmp = pipeA - pipeB;
        } else if (sortBy === 'contacts') {
          const contA = accountContactsCount.get(a.id) || 0;
          const contB = accountContactsCount.get(b.id) || 0;
          cmp = contA - contB;
        }
        return sortOrder === 'asc' ? cmp : -cmp;
      });
  }, [accounts, search, industryFilter, coverageFilter, sortBy, sortOrder, accountContactsCount, accountOpportunities]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createAccount({
      name: name.trim(),
      website: website.trim(),
      industry: industry.trim() || 'General',
      revenue: parseFloat(revenue) || 0,
      headcount: parseInt(headcount) || 0,
      location: location.trim(),
    });
    setName('');
    setWebsite('');
    setIndustry('Enterprise SaaS');
    setRevenue('');
    setHeadcount('');
    setLocation('');
    setModalOpen(false);
  };

  const toggleSort = (col: 'name' | 'revenue' | 'headcount' | 'pipeline' | 'contacts') => {
    if (sortBy === col) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortOrder(col === 'name' ? 'asc' : 'desc');
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background overflow-y-auto">
      <Header
        onToggleMobileSidebar={onToggleMobileSidebar}
        title="Accounts"
        icon="accounts"
        onOpenCreate={() => setModalOpen(true)}
        createLabel="Create account"
        onOpenSettings={onOpenSettings}
      />

      <div className="flex-1 p-6 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Page Context Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Account Management & GTM Coverage</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Target enterprise organizations, relationship health, and portfolio pipeline influence.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-control bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors shadow-xs shrink-0 self-start sm:self-auto"
          >
            <Plus className="size-3.5" />
            <span>Create account</span>
          </button>
        </div>

        {/* Real KPI Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <span className="text-xs text-muted-foreground font-medium block">Total Accounts</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-foreground tabular-nums">{totalAccounts}</span>
              <span className="text-[11px] text-muted-foreground">managed</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium block">Tracked Revenue</span>
              <DollarSign className="size-3.5 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-foreground tabular-nums">{formatMoney(totalRevenue)}</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium block">Active Pipeline</span>
              <TrendingUp className="size-3.5 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-foreground tabular-nums">{formatMoney(totalPipeline)}</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium block">With Active Deals</span>
              <Handshake className="size-3.5 text-indigo-500" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-foreground tabular-nums">{accountsWithOpps.length}</span>
              <span className="text-[11px] text-muted-foreground">({pipelineCoveragePct}%)</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium block">Uncovered (No Contacts)</span>
              <AlertTriangle className={`size-3.5 ${accountsWithoutContacts.length > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-foreground tabular-nums">{accountsWithoutContacts.length}</span>
              <span className="text-[11px] text-muted-foreground">accounts at risk</span>
            </div>
          </div>
        </div>

        {/* Account Insights Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Industry Distribution */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-border/60">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <PieChart className="size-4 text-blue-500" />
                <span>Industry Concentration</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {industryDistribution.length} distinct
              </span>
            </div>

            {totalAccounts === 0 ? (
              <div className="py-7 text-center border border-dashed border-border/60 rounded-lg text-xs text-muted-foreground">
                <p className="font-medium text-foreground">No accounts recorded yet</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Industry distribution and concentration will calculate automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {industryDistribution.slice(0, 4).map(([indName, count]) => {
                  const pct = Math.round((count / totalAccounts) * 100);
                  return (
                    <div key={indName} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground truncate">{indName}</span>
                        <span className="text-muted-foreground tabular-nums text-[11px]">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Account Health & Coverage Audit */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-border/60">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span>Account Coverage & Health</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Health Audit</span>
            </div>

            <div className="space-y-2.5">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Stakeholder Coverage</span>
                  <span className="font-medium text-foreground tabular-nums text-[11px]">{contactCoveragePct}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${contactCoveragePct}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Pipeline Association</span>
                  <span className="font-medium text-foreground tabular-nums text-[11px]">{pipelineCoveragePct}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${pipelineCoveragePct}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Website / Domain Presence</span>
                  <span className="font-medium text-foreground tabular-nums text-[11px]">{websiteCoveragePct}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${websiteCoveragePct}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Account Owner Assigned</span>
                  <span className="font-medium text-foreground tabular-nums text-[11px]">{ownerCoveragePct}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${ownerCoveragePct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Attention Needed / Operational Gaps */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-border/60">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <ShieldAlert className="size-4 text-amber-500" />
                <span>Attention Needed (Operational Gaps)</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Gaps Audit</span>
            </div>

            {totalAccounts === 0 ? (
              <div className="py-7 text-center border border-dashed border-border/60 rounded-lg text-xs text-muted-foreground">
                <p className="font-medium text-foreground">No operational gaps</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Coverage gaps, single-threading, and stalled accounts will be flagged here.
                </p>
              </div>
            ) : uncoveredAccounts.length === 0 && pipelineGapAccounts.length === 0 && missingWebsiteAccounts.length === 0 ? (
              <div className="py-7 text-center border border-border/40 rounded-lg text-xs text-muted-foreground bg-muted/20">
                <CheckCircle2 className="size-6 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                <p className="font-medium text-foreground">Complete account coverage</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  All accounts have active contacts, pipeline opportunities, and websites.
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {uncoveredAccounts.length > 0 && (
                  <div className="p-2 rounded-lg border border-amber-500/20 bg-amber-500/5 flex items-start gap-2">
                    <AlertCircle className="size-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">
                        {uncoveredAccounts.length} {uncoveredAccounts.length === 1 ? 'account has' : 'accounts have'} zero contacts
                      </span>
                      <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                        e.g. {uncoveredAccounts.slice(0, 2).map((a) => a.name).join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                {pipelineGapAccounts.length > 0 && (
                  <div className="p-2 rounded-lg border border-border bg-muted/30 flex items-start gap-2">
                    <Handshake className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">
                        {pipelineGapAccounts.length} accounts without pipeline deals
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        Create opportunities to track active deal progression.
                      </p>
                    </div>
                  </div>
                )}

                {missingWebsiteAccounts.length > 0 && (
                  <div className="p-2 rounded-lg border border-border bg-muted/20 flex items-start gap-2">
                    <Globe className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">
                        {missingWebsiteAccounts.length} missing domain website
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        Add website URLs to enable RLOE domain-level matching.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Accounts Table & Filtering */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          {/* Filter Bar */}
          <div className="p-4 border-b border-border flex flex-col md:flex-row gap-3 md:items-center md:justify-between bg-muted/10">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative w-full sm:w-64">
                <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter by account, website, or industry…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-full rounded-control border border-input bg-background pl-8 pr-3 text-xs outline-none focus:border-ring placeholder:text-muted-foreground/70"
                />
              </div>

              {/* Industry filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="size-3 text-muted-foreground shrink-0" />
                <select
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  className="h-8 rounded-control border border-input bg-background px-2 text-xs outline-none focus:border-ring text-foreground"
                >
                  <option value="ALL">All Industries</option>
                  {industryDistribution.map(([ind]) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                  {industryDistribution.length === 0 &&
                    COMMON_INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                </select>
              </div>

              {/* Coverage filter */}
              <select
                value={coverageFilter}
                onChange={(e) => setCoverageFilter(e.target.value)}
                className="h-8 rounded-control border border-input bg-background px-2 text-xs outline-none focus:border-ring text-foreground"
              >
                <option value="ALL">All Coverage Statuses</option>
                <option value="HAS_OPPS">With Active Pipeline</option>
                <option value="NO_OPPS">No Pipeline</option>
                <option value="HAS_CONTACTS">Has Stakeholders</option>
                <option value="NO_CONTACTS">Uncovered (Zero Contacts)</option>
                <option value="NO_WEBSITE">Missing Website</option>
              </select>
            </div>

            <div className="text-xs text-muted-foreground whitespace-nowrap">
              Showing <strong className="text-foreground">{filteredAccounts.length}</strong> of {totalAccounts} accounts
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead className="border-b border-border bg-muted/30 text-muted-foreground font-medium select-none text-[11px] uppercase tracking-wider">
                <tr>
                  <th
                    className="py-2.5 px-4 min-w-[220px] border-r border-border/50 cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Company Name</span>
                      <ArrowUpDown className="size-3 opacity-60" />
                    </div>
                  </th>
                  <th className="py-2.5 px-4 min-w-[160px] border-r border-border/50">Industry</th>
                  <th
                    className="py-2.5 px-4 min-w-[140px] border-r border-border/50 cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort('revenue')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Revenue</span>
                      <ArrowUpDown className="size-3 opacity-60" />
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-4 min-w-[140px] border-r border-border/50 cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort('pipeline')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Pipeline Value</span>
                      <ArrowUpDown className="size-3 opacity-60" />
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-4 min-w-[120px] border-r border-border/50 cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort('contacts')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Contacts</span>
                      <ArrowUpDown className="size-3 opacity-60" />
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-4 min-w-[110px] border-r border-border/50 cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort('headcount')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Headcount</span>
                      <ArrowUpDown className="size-3 opacity-60" />
                    </div>
                  </th>
                  <th className="py-2.5 px-4 min-w-[140px] border-r border-border/50">Owner</th>
                  <th className="py-2.5 px-4 w-16 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border text-foreground">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-muted-foreground">
                      <Building2 className="size-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm font-medium text-foreground">No accounts found</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                        {search || industryFilter !== 'ALL' || coverageFilter !== 'ALL'
                          ? 'No organizations match the selected criteria. Try adjusting your query.'
                          : 'Create your first account to start tracking companies, pipeline influence, and multi-threading depth.'}
                      </p>
                      {!search && industryFilter === 'ALL' && coverageFilter === 'ALL' && (
                        <button
                          type="button"
                          onClick={() => setModalOpen(true)}
                          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-control bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-xs"
                        >
                          <Plus className="size-3.5" />
                          <span>Create account</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((a) => {
                    const contactsCount = accountContactsCount.get(a.id) || 0;
                    const oppsCount = accountOpportunities.countMap.get(a.id) || 0;
                    const pipeVal = accountOpportunities.amountMap.get(a.id) || 0;
                    const formattedRev = new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      maximumFractionDigits: 0,
                    }).format(a.revenue || 0);

                    return (
                      <tr key={a.id} className="hover:bg-muted/40 transition-colors group">
                        {/* Company Name & Website */}
                        <td className="py-2.5 px-4 font-medium border-r border-border/50">
                          <div className="space-y-0.5">
                            <span className="font-medium text-foreground truncate block">{a.name}</span>
                            {a.website ? (
                              <a
                                href={a.website.startsWith('http') ? a.website : `https://${a.website}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:underline hover:text-foreground"
                              >
                                <Globe className="size-3 shrink-0" />
                                <span className="truncate">{a.website.replace(/^https?:\/\//, '')}</span>
                              </a>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/60 italic">No website</span>
                            )}
                          </div>
                        </td>

                        {/* Industry */}
                        <td className="py-2.5 px-4 border-r border-border/50">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-muted border border-border/60 text-muted-foreground truncate max-w-[140px]">
                            {a.industry || 'General'}
                          </span>
                        </td>

                        {/* Revenue */}
                        <td className="py-2.5 px-4 border-r border-border/50 tabular-nums font-medium text-foreground">
                          {formattedRev}
                        </td>

                        {/* Pipeline Value */}
                        <td className="py-2.5 px-4 border-r border-border/50 tabular-nums font-medium">
                          {pipeVal > 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {formatMoney(pipeVal)} ({oppsCount} {oppsCount === 1 ? 'deal' : 'deals'})
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60 text-[11px] italic">$0.00</span>
                          )}
                        </td>

                        {/* Contacts Count */}
                        <td className="py-2.5 px-4 border-r border-border/50">
                          {contactsCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-medium">
                              <Users className="size-3" />
                              <span>{contactsCount}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              <AlertCircle className="size-3" />
                              <span>0 contacts</span>
                            </span>
                          )}
                        </td>

                        {/* Headcount */}
                        <td className="py-2.5 px-4 border-r border-border/50 tabular-nums text-muted-foreground">
                          {a.headcount ? a.headcount.toLocaleString() : '—'}
                        </td>

                        {/* Owner */}
                        <td className="py-2.5 px-4 border-r border-border/50 text-muted-foreground">
                          {a.owner?.name || 'Unassigned'}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete account "${a.name}"?`)) {
                                deleteAccount(a.id);
                              }
                            }}
                            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete account"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Account Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl z-10 space-y-4 text-foreground">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">Create account</h3>
                <p className="text-xs text-muted-foreground">Add an enterprise organization to your GTM portfolio.</p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-8 rounded-control border border-input bg-background px-3 outline-none focus:border-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Website / Domain</label>
                <input
                  type="text"
                  placeholder="https://acme.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full h-8 rounded-control border border-input bg-background px-3 outline-none focus:border-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Industry</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full h-8 rounded-control border border-input bg-background px-2.5 outline-none focus:border-ring text-foreground"
                >
                  {COMMON_INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Annual Revenue (USD)</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000000"
                    value={revenue}
                    onChange={(e) => setRevenue(e.target.value)}
                    className="w-full h-8 rounded-control border border-input bg-background px-3 outline-none focus:border-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Headcount</label>
                  <input
                    type="number"
                    placeholder="e.g. 150"
                    value={headcount}
                    onChange={(e) => setHeadcount(e.target.value)}
                    className="w-full h-8 rounded-control border border-input bg-background px-3 outline-none focus:border-ring"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Headquarters Location</label>
                <input
                  type="text"
                  placeholder="e.g. San Francisco, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full h-8 rounded-control border border-input bg-background px-3 outline-none focus:border-ring"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 rounded-control text-xs font-medium hover:bg-muted text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-control text-xs font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-xs"
                >
                  Create account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
