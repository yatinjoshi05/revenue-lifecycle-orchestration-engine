import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  X,
  Search,
  Mail,
  Phone,
  Building2,
  AlertTriangle,
  CheckCircle2,
  ArrowUpDown,
  Filter,
  Trash2,
  Copy,
  Check,
  UserCheck,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Header } from '../components/Header';
import { useCRM } from '../context/DataContext';
import { Contact } from '../types/crm';

interface ContactsPageProps {
  onToggleMobileSidebar: () => void;
  onOpenSettings?: () => void;
}

const COMMON_ROLES = [
  'Decision Maker',
  'Champion',
  'Influencer',
  'Technical Evaluator',
  'Executive Sponsor',
  'Member',
];

export const ContactsPage: React.FC<ContactsPageProps> = ({
  onToggleMobileSidebar,
  onOpenSettings,
}) => {
  const { contacts, accounts, createContact, deleteContact } = useCRM();

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [accountFilter, setAccountFilter] = useState('ALL');
  const [coverageFilter, setCoverageFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'account'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Member');
  const [accountId, setAccountId] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const accountMap = useMemo(() => {
    return new Map(accounts.map((a) => [a.id, a.name]));
  }, [accounts]);

  // Decision maker detection helper
  const isDecisionMakerRole = (r?: string) => {
    if (!r) return false;
    const lower = r.toLowerCase();
    return (
      lower.includes('decision') ||
      lower.includes('executive') ||
      lower.includes('vp') ||
      lower.includes('director') ||
      lower.includes('c-level') ||
      lower.includes('chief') ||
      lower.includes('head')
    );
  };

  // Real KPIs calculation
  const totalContacts = contacts.length;
  const decisionMakers = contacts.filter((c) => isDecisionMakerRole(c.role));
  const contactsWithEmail = contacts.filter((c) => !!c.email && c.email.trim().length > 0);
  const contactsWithPhone = contacts.filter((c) => !!c.phone && c.phone.trim().length > 0);
  const contactsWithAccount = contacts.filter((c) => !!c.accountId && accountMap.has(c.accountId));

  const emailCoveragePct = totalContacts > 0 ? Math.round((contactsWithEmail.length / totalContacts) * 100) : 0;
  const phoneCoveragePct = totalContacts > 0 ? Math.round((contactsWithPhone.length / totalContacts) * 100) : 0;
  const accountCoveragePct = totalContacts > 0 ? Math.round((contactsWithAccount.length / totalContacts) * 100) : 0;
  const decisionMakerPct = totalContacts > 0 ? Math.round((decisionMakers.length / totalContacts) * 100) : 0;

  // Role distribution calculation
  const roleDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    contacts.forEach((c) => {
      const r = c.role || 'Unspecified';
      counts[r] = (counts[r] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [contacts]);

  // Operational GTM Signals derived from real data
  const orphanedContacts = useMemo(() => {
    return contacts.filter((c) => !c.accountId || !accountMap.has(c.accountId));
  }, [contacts, accountMap]);

  const incompleteContacts = useMemo(() => {
    return contacts.filter((c) => !c.email || !c.phone);
  }, [contacts]);

  const singleThreadedAccounts = useMemo(() => {
    const accContactCount: Record<string, number> = {};
    contacts.forEach((c) => {
      if (c.accountId && accountMap.has(c.accountId)) {
        accContactCount[c.accountId] = (accContactCount[c.accountId] || 0) + 1;
      }
    });
    return Object.entries(accContactCount)
      .filter(([_, count]) => count === 1)
      .map(([accId]) => accountMap.get(accId) || 'Account');
  }, [contacts, accountMap]);

  // Filtered and sorted contacts
  const filteredContacts = useMemo(() => {
    return contacts
      .filter((c) => {
        // Search
        const accName = accountMap.get(c.accountId) || '';
        const searchLower = search.toLowerCase();
        const matchesSearch =
          !search ||
          c.name.toLowerCase().includes(searchLower) ||
          c.email.toLowerCase().includes(searchLower) ||
          c.role.toLowerCase().includes(searchLower) ||
          accName.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;

        // Role filter
        if (roleFilter !== 'ALL') {
          if (roleFilter === 'DECISION_MAKER') {
            if (!isDecisionMakerRole(c.role)) return false;
          } else if (c.role !== roleFilter) {
            return false;
          }
        }

        // Account filter
        if (accountFilter !== 'ALL') {
          if (accountFilter === 'UNASSIGNED') {
            if (c.accountId && accountMap.has(c.accountId)) return false;
          } else if (c.accountId !== accountFilter) {
            return false;
          }
        }

        // Coverage filter
        if (coverageFilter === 'NO_EMAIL' && !!c.email) return false;
        if (coverageFilter === 'NO_PHONE' && !!c.phone) return false;
        if (coverageFilter === 'HAS_BOTH' && (!c.email || !c.phone)) return false;

        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'name') {
          cmp = a.name.localeCompare(b.name);
        } else if (sortBy === 'role') {
          cmp = (a.role || '').localeCompare(b.role || '');
        } else if (sortBy === 'account') {
          const nameA = accountMap.get(a.accountId) || '';
          const nameB = accountMap.get(b.accountId) || '';
          cmp = nameA.localeCompare(nameB);
        }
        return sortOrder === 'asc' ? cmp : -cmp;
      });
  }, [contacts, search, roleFilter, accountFilter, coverageFilter, sortBy, sortOrder, accountMap]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createContact({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role: role.trim() || 'Member',
      accountId: accountId.trim(),
    });
    setName('');
    setEmail('');
    setPhone('');
    setRole('Member');
    setAccountId('');
    setModalOpen(false);
  };

  const handleCopyEmail = (contactId: string, emailStr: string) => {
    if (!emailStr) return;
    navigator.clipboard.writeText(emailStr);
    setCopiedId(contactId);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const toggleSort = (col: 'name' | 'role' | 'account') => {
    if (sortBy === col) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background overflow-y-auto">
      <Header
        onToggleMobileSidebar={onToggleMobileSidebar}
        title="Contacts"
        icon="contacts"
        onOpenCreate={() => setModalOpen(true)}
        createLabel="Create contact"
        onOpenSettings={onOpenSettings}
      />

      <div className="flex-1 p-6 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Page Context Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Contact Directory & GTM Network</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Stakeholder relationship depth, decision maker coverage, and multi-threading intelligence.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-control bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors shadow-xs shrink-0 self-start sm:self-auto"
          >
            <Plus className="size-3.5" />
            <span>Create contact</span>
          </button>
        </div>

        {/* Real KPI Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <span className="text-xs text-muted-foreground font-medium block">Total Contacts</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-foreground tabular-nums">{totalContacts}</span>
              <span className="text-[11px] text-muted-foreground">recorded</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium block">Decision Makers</span>
              <UserCheck className="size-3.5 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-foreground tabular-nums">{decisionMakers.length}</span>
              <span className="text-[11px] text-muted-foreground">({decisionMakerPct}%)</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium block">Email Coverage</span>
              <Mail className="size-3.5 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-foreground tabular-nums">{contactsWithEmail.length}</span>
              <span className="text-[11px] text-muted-foreground">({emailCoveragePct}%)</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium block">Phone Coverage</span>
              <Phone className="size-3.5 text-indigo-500" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-foreground tabular-nums">{contactsWithPhone.length}</span>
              <span className="text-[11px] text-muted-foreground">({phoneCoveragePct}%)</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium block">Account Linked</span>
              <Building2 className="size-3.5 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-foreground tabular-nums">{contactsWithAccount.length}</span>
              <span className="text-[11px] text-muted-foreground">({accountCoveragePct}%)</span>
            </div>
          </div>
        </div>

        {/* Contact Insights Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Role Distribution */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-border/60">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <ShieldCheck className="size-4 text-blue-500" />
                <span>Stakeholder Role Distribution</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {roleDistribution.length} distinct {roleDistribution.length === 1 ? 'role' : 'roles'}
              </span>
            </div>

            {totalContacts === 0 ? (
              <div className="py-7 text-center border border-dashed border-border/60 rounded-lg text-xs text-muted-foreground">
                <p className="font-medium text-foreground">No contact roles recorded yet</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Categorize stakeholders as Decision Makers, Champions, or Evaluators.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {roleDistribution.slice(0, 4).map(([rName, count]) => {
                  const pct = Math.round((count / totalContacts) * 100);
                  return (
                    <div key={rName} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground truncate">{rName}</span>
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

          {/* Contact Data Health */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-border/60">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span>Data Completeness & Quality</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Quality Audit</span>
            </div>

            <div className="space-y-2.5">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Email Reachability</span>
                  <span className="font-medium text-foreground tabular-nums text-[11px]">{emailCoveragePct}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${emailCoveragePct}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Phone Reachability</span>
                  <span className="font-medium text-foreground tabular-nums text-[11px]">{phoneCoveragePct}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${phoneCoveragePct}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Account Mapping</span>
                  <span className="font-medium text-foreground tabular-nums text-[11px]">{accountCoveragePct}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${accountCoveragePct}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Decision Maker Ratio</span>
                  <span className="font-medium text-foreground tabular-nums text-[11px]">{decisionMakerPct}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${decisionMakerPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* GTM Signals / Operational Alerts */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-border/60">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <AlertTriangle className="size-4 text-amber-500" />
                <span>Operational GTM Signals</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Active Audit</span>
            </div>

            {totalContacts === 0 ? (
              <div className="py-7 text-center border border-dashed border-border/60 rounded-lg text-xs text-muted-foreground">
                <p className="font-medium text-foreground">No contact alerts</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Signals on orphaned contacts and multi-threading risks will appear here.
                </p>
              </div>
            ) : orphanedContacts.length === 0 && incompleteContacts.length === 0 && singleThreadedAccounts.length === 0 ? (
              <div className="py-7 text-center border border-border/40 rounded-lg text-xs text-muted-foreground bg-muted/20">
                <CheckCircle2 className="size-6 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                <p className="font-medium text-foreground">All contacts healthy</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  100% of recorded contacts are mapped to accounts with complete details.
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {orphanedContacts.length > 0 && (
                  <div className="p-2 rounded-lg border border-amber-500/20 bg-amber-500/5 flex items-start gap-2">
                    <AlertCircle className="size-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">
                        {orphanedContacts.length} {orphanedContacts.length === 1 ? 'contact' : 'contacts'} missing an account
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        Link contacts to organizations to maintain account history.
                      </p>
                    </div>
                  </div>
                )}

                {incompleteContacts.length > 0 && (
                  <div className="p-2 rounded-lg border border-border bg-muted/30 flex items-start gap-2">
                    <Mail className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">
                        {incompleteContacts.length} missing phone or email
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        Enrich direct contact data to unblock outreach.
                      </p>
                    </div>
                  </div>
                )}

                {singleThreadedAccounts.length > 0 && (
                  <div className="p-2 rounded-lg border border-blue-500/20 bg-blue-500/5 flex items-start gap-2">
                    <Users className="size-3.5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">
                        {singleThreadedAccounts.length} single-threaded {singleThreadedAccounts.length === 1 ? 'account' : 'accounts'}
                      </span>
                      <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                        e.g. {singleThreadedAccounts.slice(0, 2).join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Contacts Table & Controls */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          {/* Filter Bar */}
          <div className="p-4 border-b border-border flex flex-col md:flex-row gap-3 md:items-center md:justify-between bg-muted/10">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative w-full sm:w-64">
                <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter by name, email, role, or account…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-full rounded-control border border-input bg-background pl-8 pr-3 text-xs outline-none focus:border-ring placeholder:text-muted-foreground/70"
                />
              </div>

              {/* Role filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="size-3 text-muted-foreground shrink-0" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="h-8 rounded-control border border-input bg-background px-2 text-xs outline-none focus:border-ring text-foreground"
                >
                  <option value="ALL">All Roles</option>
                  <option value="DECISION_MAKER">Decision Makers</option>
                  {COMMON_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Account filter */}
              {accounts.length > 0 && (
                <select
                  value={accountFilter}
                  onChange={(e) => setAccountFilter(e.target.value)}
                  className="h-8 rounded-control border border-input bg-background px-2 text-xs outline-none focus:border-ring text-foreground max-w-[160px] truncate"
                >
                  <option value="ALL">All Accounts</option>
                  <option value="UNASSIGNED">Unassigned Only</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Completeness filter */}
              <select
                value={coverageFilter}
                onChange={(e) => setCoverageFilter(e.target.value)}
                className="h-8 rounded-control border border-input bg-background px-2 text-xs outline-none focus:border-ring text-foreground"
              >
                <option value="ALL">All Records</option>
                <option value="HAS_BOTH">Complete (Email & Phone)</option>
                <option value="NO_EMAIL">Missing Email</option>
                <option value="NO_PHONE">Missing Phone</option>
              </select>
            </div>

            <div className="text-xs text-muted-foreground whitespace-nowrap">
              Showing <strong className="text-foreground">{filteredContacts.length}</strong> of {totalContacts} contacts
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead className="border-b border-border bg-muted/30 text-muted-foreground font-medium select-none text-[11px] uppercase tracking-wider">
                <tr>
                  <th
                    className="py-2.5 px-4 min-w-[200px] border-r border-border/50 cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Name</span>
                      <ArrowUpDown className="size-3 opacity-60" />
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-4 min-w-[160px] border-r border-border/50 cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort('role')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Role / Seniority</span>
                      <ArrowUpDown className="size-3 opacity-60" />
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-4 min-w-[180px] border-r border-border/50 cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort('account')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Account</span>
                      <ArrowUpDown className="size-3 opacity-60" />
                    </div>
                  </th>
                  <th className="py-2.5 px-4 min-w-[200px] border-r border-border/50">Direct Email</th>
                  <th className="py-2.5 px-4 min-w-[150px] border-r border-border/50">Direct Phone</th>
                  <th className="py-2.5 px-4 w-16 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border text-foreground">
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-muted-foreground">
                      <Users className="size-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm font-medium text-foreground">No contacts found</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                        {search || roleFilter !== 'ALL' || accountFilter !== 'ALL' || coverageFilter !== 'ALL'
                          ? 'No contacts match the selected filter criteria. Try adjusting your query.'
                          : 'Create your first contact to start tracking stakeholders and decision-maker coverage.'}
                      </p>
                      {!search && roleFilter === 'ALL' && accountFilter === 'ALL' && (
                        <button
                          type="button"
                          onClick={() => setModalOpen(true)}
                          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-control bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-xs"
                        >
                          <Plus className="size-3.5" />
                          <span>Create contact</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((c) => {
                    const accName = accountMap.get(c.accountId);
                    const isDM = isDecisionMakerRole(c.role);
                    const initials = c.name
                      ? c.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()
                      : 'U';

                    return (
                      <tr key={c.id} className="hover:bg-muted/40 transition-colors group">
                        {/* Name Column */}
                        <td className="py-2.5 px-4 font-medium border-r border-border/50">
                          <div className="flex items-center gap-2.5">
                            <div className="size-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground shrink-0 border border-border">
                              {initials}
                            </div>
                            <span className="truncate text-foreground font-medium">{c.name}</span>
                          </div>
                        </td>

                        {/* Role Column */}
                        <td className="py-2.5 px-4 border-r border-border/50">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                              isDM
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                : 'bg-muted text-muted-foreground border border-border/60'
                            }`}
                          >
                            {isDM && <ShieldCheck className="size-3" />}
                            <span>{c.role || 'Member'}</span>
                          </span>
                        </td>

                        {/* Account Column */}
                        <td className="py-2.5 px-4 border-r border-border/50 text-muted-foreground">
                          {accName ? (
                            <span className="inline-flex items-center gap-1.5 text-foreground hover:underline">
                              <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate">{accName}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              <AlertCircle className="size-3" />
                              <span>Unassigned</span>
                            </span>
                          )}
                        </td>

                        {/* Email Column */}
                        <td className="py-2.5 px-4 border-r border-border/50 text-muted-foreground">
                          {c.email ? (
                            <div className="flex items-center justify-between gap-1 group/email">
                              <a
                                href={`mailto:${c.email}`}
                                className="truncate hover:underline hover:text-foreground text-foreground"
                              >
                                {c.email}
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCopyEmail(c.id, c.email)}
                                className="opacity-0 group-hover/email:opacity-100 p-1 rounded hover:bg-muted text-muted-foreground transition-opacity"
                                title="Copy email"
                              >
                                {copiedId === c.id ? (
                                  <Check className="size-3 text-emerald-500" />
                                ) : (
                                  <Copy className="size-3" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground/60 italic">—</span>
                          )}
                        </td>

                        {/* Phone Column */}
                        <td className="py-2.5 px-4 border-r border-border/50 text-muted-foreground">
                          {c.phone ? (
                            <a
                              href={`tel:${c.phone}`}
                              className="tabular-nums hover:underline hover:text-foreground text-foreground"
                            >
                              {c.phone}
                            </a>
                          ) : (
                            <span className="text-[11px] text-muted-foreground/60 italic">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete contact "${c.name}"?`)) {
                                deleteContact(c.id);
                              }
                            }}
                            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete contact"
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

      {/* Create Contact Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl z-10 space-y-4 text-foreground">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">Create contact</h3>
                <p className="text-xs text-muted-foreground">Add a key stakeholder to your GTM network.</p>
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
                <label className="font-medium text-foreground">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Lee"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-8 rounded-control border border-input bg-background px-3 outline-none focus:border-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Role / Seniority *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-8 rounded-control border border-input bg-background px-2.5 outline-none focus:border-ring text-foreground"
                >
                  {COMMON_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                  <option value="Technical Lead">Technical Lead</option>
                  <option value="Procurement">Procurement</option>
                  <option value="Legal">Legal</option>
                  <option value="End User">End User</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Associated Account</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full h-8 rounded-control border border-input bg-background px-2.5 outline-none focus:border-ring text-foreground"
                >
                  <option value="">Unassigned (No Account)</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Work Email</label>
                  <input
                    type="email"
                    placeholder="jordan@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-8 rounded-control border border-input bg-background px-3 outline-none focus:border-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Direct Phone</label>
                  <input
                    type="tel"
                    placeholder="+1 555-0199"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-8 rounded-control border border-input bg-background px-3 outline-none focus:border-ring"
                  />
                </div>
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
                  Create contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
