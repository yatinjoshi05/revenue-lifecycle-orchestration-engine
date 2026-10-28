import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { nexusApi, Account360 } from '../services/nexusApi';
import {
  Building2,
  Search,
  Activity,
  Radio,
  ShieldAlert,
  Clock,
  History,
  RotateCw,
  AlertTriangle,
  ArrowRight,
  Layers,
  CheckCircle,
} from 'lucide-react';

interface Account360PageProps {
  onToggleMobileSidebar: () => void;
}

export const Account360Page: React.FC<Account360PageProps> = ({
  onToggleMobileSidebar,
}) => {
  const { domain: urlDomain } = useParams<{ domain?: string }>();
  const navigate = useNavigate();

  const [inputDomain, setInputDomain] = useState(urlDomain || '');
  const [accountData, setAccountData] = useState<Account360 | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const fetchAccount360 = useCallback(async (targetDomain: string) => {
    if (!targetDomain.trim()) return;
    setIsLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const data = await nexusApi.getAccount360(targetDomain.trim().toLowerCase());
      setAccountData(data);
    } catch (err: any) {
      if (err.status === 404 || err.code === 'ACCOUNT_NOT_FOUND') {
        setNotFound(true);
        setAccountData(null);
      } else {
        setError(err.message || 'Failed to fetch Account 360 data');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (urlDomain) {
      setInputDomain(urlDomain);
      fetchAccount360(urlDomain);
    }
  }, [urlDomain, fetchAccount360]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputDomain.trim()) {
      navigate(`/accounts-360/${encodeURIComponent(inputDomain.trim().toLowerCase())}`);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background text-foreground overflow-y-auto">
      {/* Top Header */}
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-card px-4 sm:px-6 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="flex size-8 items-center justify-center rounded-control border border-border md:hidden hover:bg-muted"
            aria-label="Toggle Navigation"
          >
            <Building2 className="size-4" />
          </button>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              Unified Account 360
              {accountData && (
                <span className="px-2 py-0.5 text-[11px] font-medium rounded-control border border-border bg-muted">
                  {accountData.account.domain}
                </span>
              )}
            </h1>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Single source of truth across signals, handoffs, pipeline integrity, and audit history
            </p>
          </div>
        </div>

        {urlDomain && (
          <button
            type="button"
            onClick={() => fetchAccount360(urlDomain)}
            disabled={isLoading}
            className="flex items-center gap-1.5 h-8 px-3 rounded-control border border-border bg-background hover:bg-muted text-xs font-medium transition-colors disabled:opacity-50"
          >
            <RotateCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        )}
      </header>

      {/* Main Container */}
      <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Domain Lookup Form */}
        <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
            <input
              type="text"
              required
              placeholder="Enter company domain (e.g. stripe.com, acme.com)..."
              value={inputDomain}
              onChange={(e) => setInputDomain(e.target.value)}
              className="h-9 w-full rounded-control border border-input bg-card pl-9 pr-3 text-xs outline-none focus:border-ring"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="h-9 px-4 rounded-control bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            Lookup 360
          </button>
        </form>

        {/* Loading State */}
        {isLoading && (
          <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
            <RotateCw className="size-6 animate-spin mx-auto text-primary" />
            <p>Fetching unified trace from PostgreSQL database...</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="rounded-control border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Honest 404 Not Found State */}
        {notFound && (
          <div className="rounded-control border border-border bg-card p-12 text-center text-xs text-muted-foreground space-y-3">
            <Building2 className="size-8 mx-auto text-muted-foreground/60" />
            <p className="font-semibold text-foreground text-sm">
              Account with domain &apos;{urlDomain}&apos; not found
            </p>
            <p className="max-w-md mx-auto text-muted-foreground">
              Zero records exist in the database for this domain. To register this account, ingest an event with this domain via the Tag Inspector.
            </p>
            <div className="pt-2">
              <Link
                to="/inspector"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-control bg-primary text-primary-foreground text-xs font-medium"
              >
                Ingest Event for {urlDomain}
              </Link>
            </div>
          </div>
        )}

        {/* Empty Search Prompt */}
        {!urlDomain && !accountData && !isLoading && (
          <div className="rounded-control border border-border bg-card p-12 text-center text-xs text-muted-foreground space-y-2">
            <Search className="size-8 mx-auto text-muted-foreground/60" />
            <p className="font-semibold text-foreground text-sm">Search any account domain</p>
            <p className="max-w-md mx-auto text-muted-foreground">
              Lookup any company domain to inspect its complete unified lifecycle across product events, signals, GTM handoffs, and revenue integrity.
            </p>
          </div>
        )}

        {/* Account 360 Content Display */}
        {accountData && (
          <div className="space-y-6">
            {/* Account Profile Header Card */}
            <div className="rounded-control border border-border bg-card p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {accountData.account.name || accountData.account.domain}
                  </h2>
                  <p className="text-xs font-mono text-muted-foreground">
                    Domain: {accountData.account.domain} &bull; ID: {accountData.account.id}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-control border border-primary/30 bg-primary/10 text-primary capitalize">
                    Stage: {accountData.account.lifecycle_stage.replace(/_/g, ' ')}
                  </span>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-control border border-border bg-muted capitalize">
                    Tier: {accountData.account.tier || 'Standard'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-control bg-muted/40 border border-border/60">
                  <span className="text-[10px] text-muted-foreground block">Health Score</span>
                  <span className="text-base font-bold text-foreground">
                    {accountData.account.health_score || 100} / 100
                  </span>
                </div>
                <div className="p-3 rounded-control bg-muted/40 border border-border/60">
                  <span className="text-[10px] text-muted-foreground block">Total Events</span>
                  <span className="text-base font-bold text-foreground">
                    {accountData.events?.length || 0}
                  </span>
                </div>
                <div className="p-3 rounded-control bg-muted/40 border border-border/60">
                  <span className="text-[10px] text-muted-foreground block">Active Signals</span>
                  <span className="text-base font-bold text-foreground">
                    {accountData.signals?.length || 0}
                  </span>
                </div>
                <div className="p-3 rounded-control bg-muted/40 border border-border/60">
                  <span className="text-[10px] text-muted-foreground block">Open Issues</span>
                  <span className={`text-base font-bold ${accountData.integrityIssues?.length > 0 ? 'text-destructive' : 'text-foreground'}`}>
                    {accountData.integrityIssues?.length || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* 2-Column Split: Signals & Handoffs vs Events & Audit */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Signals & Active Handoffs */}
              <div className="space-y-6">
                {/* Signals Section */}
                <div className="rounded-control border border-border bg-card p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <Radio className="size-4 text-blue-500" />
                    Lifecycle Signals ({accountData.signals?.length || 0})
                  </h3>
                  {accountData.signals?.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-3 text-center">
                      No lifecycle signals detected for this account.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {accountData.signals.map((sig) => (
                        <div key={sig.id} className="p-2.5 rounded-control border border-border/60 bg-muted/30 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] font-semibold text-foreground">
                              {sig.signal_type}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">
                              {sig.severity}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Detected: {new Date(sig.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active Handoffs Section */}
                <div className="rounded-control border border-border bg-card p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <Clock className="size-4 text-indigo-500" />
                    GTM Handoffs ({accountData.activeHandoffs?.length || 0})
                  </h3>
                  {accountData.activeHandoffs?.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-3 text-center">
                      No active handoffs currently assigned.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {accountData.activeHandoffs.map((h) => (
                        <div key={h.id} className="p-2.5 rounded-control border border-border/60 bg-muted/30 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold capitalize text-foreground">
                              Role: {h.target_role.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-control bg-muted">
                              {h.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Assigned to: {h.assigned_owner_id} &bull; SLA: {new Date(h.sla_deadline).toLocaleTimeString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Events & Audit Trail */}
              <div className="space-y-6">
                {/* Product Events Stream */}
                <div className="rounded-control border border-border bg-card p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <Activity className="size-4 text-emerald-500" />
                    Product Usage Events ({accountData.events?.length || 0})
                  </h3>
                  {accountData.events?.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-3 text-center">
                      No product events ingested for this domain.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {accountData.events.map((evt) => (
                        <div key={evt.id} className="p-2.5 rounded-control border border-border/60 bg-muted/30 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] font-medium text-foreground">
                              {evt.event_name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(evt.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Audit Trail */}
                <div className="rounded-control border border-border bg-card p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <History className="size-4 text-zinc-400" />
                    Audit Log ({accountData.auditTrail?.length || 0})
                  </h3>
                  {accountData.auditTrail?.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-3 text-center">
                      No audit history recorded.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {accountData.auditTrail.map((log) => (
                        <div key={log.id} className="p-2.5 rounded-control border border-border/60 bg-muted/30 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">{log.action}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            Actor: {log.actor}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
