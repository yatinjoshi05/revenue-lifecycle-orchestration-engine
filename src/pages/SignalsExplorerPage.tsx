import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { nexusApi, LifecycleSignal } from '../services/nexusApi';
import {
  Radio,
  Search,
  Filter,
  RotateCw,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Layers,
  CheckCircle,
} from 'lucide-react';

interface SignalsExplorerPageProps {
  onToggleMobileSidebar: () => void;
}

export const SignalsExplorerPage: React.FC<SignalsExplorerPageProps> = ({
  onToggleMobileSidebar,
}) => {
  const [signals, setSignals] = useState<LifecycleSignal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchDomain, setSearchDomain] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedSignal, setSelectedSignal] = useState<LifecycleSignal | null>(null);

  const fetchSignals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await nexusApi.getSignals({
        severity: severityFilter !== 'all' ? severityFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        domain: searchDomain.trim() ? searchDomain.trim() : undefined,
      });
      setSignals(data);
    } catch (err: any) {
      console.warn('Failed to fetch signals:', err.message);
      setError(err.message || 'Error fetching signals from backend');
    } finally {
      setIsLoading(false);
    }
  }, [severityFilter, typeFilter, searchDomain]);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  const severityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
        return 'border-destructive/30 bg-destructive/10 text-destructive';
      case 'warning':
        return 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'info':
      default:
        return 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400';
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
            <Radio className="size-4" />
          </button>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              Signal Explorer
              <span className="px-2 py-0.5 text-[11px] font-medium rounded-control border border-border bg-muted">
                {signals.length} Signals
              </span>
            </h1>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Derived product usage intent, adoption spikes, and churn risk triggers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchSignals()}
            disabled={isLoading}
            className="flex items-center gap-1.5 h-8 px-3 rounded-control border border-border bg-background hover:bg-muted text-xs font-medium transition-colors disabled:opacity-50"
          >
            <RotateCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/inspector"
            className="flex items-center gap-1.5 h-8 px-3 rounded-control bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shrink-0"
          >
            <span><span className="hidden sm:inline">Ingest </span>Test Event</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-4">
        {/* Error Alert */}
        {error && (
          <div className="rounded-control border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button type="button" onClick={() => fetchSignals()} className="underline font-medium">
              Retry
            </button>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-control border border-border bg-card p-3">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter by account domain (e.g. acme.com)..."
                value={searchDomain}
                onChange={(e) => setSearchDomain(e.target.value)}
                className="h-8 w-full rounded-control border border-input bg-background pl-8 pr-3 text-xs outline-none focus:border-ring"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <Filter className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="h-8 rounded-control border border-input bg-background px-2 text-xs outline-none focus:border-ring"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-8 rounded-control border border-input bg-background px-2 text-xs outline-none focus:border-ring"
              >
                <option value="all">All Types</option>
                <option value="activation_intent">activation_intent</option>
                <option value="adoption_spike">adoption_spike</option>
                <option value="expansion_threshold">expansion_threshold</option>
                <option value="churn_risk">churn_risk</option>
                <option value="funding_round_detected">funding_round_detected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Signals Table */}
        <div className="rounded-control border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
              <RotateCw className="size-5 animate-spin mx-auto text-primary" />
              <p>Loading signals from database...</p>
            </div>
          ) : signals.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground space-y-3">
              <Layers className="size-8 mx-auto text-muted-foreground/60" />
              <p className="font-semibold text-foreground text-sm">No lifecycle signals found</p>
              <p className="max-w-md mx-auto text-muted-foreground">
                Zero signals exist matching the current filters. To trigger new signals, ingest product usage events using the Tag Inspector.
              </p>
              <div className="pt-2">
                <Link
                  to="/inspector"
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-control bg-primary text-primary-foreground text-xs font-medium"
                >
                  Open Tag Inspector
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-[11px] font-medium text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5">Domain</th>
                    <th className="px-4 py-2.5">Signal Type</th>
                    <th className="px-4 py-2.5">Severity</th>
                    <th className="px-4 py-2.5">Confidence</th>
                    <th className="px-4 py-2.5">Detected At</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {signals.map((sig) => (
                    <tr key={sig.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">
                        <Link
                          to={`/accounts-360/${encodeURIComponent(sig.domain || sig.account_id)}`}
                          className="hover:underline flex items-center gap-1"
                        >
                          {sig.domain || sig.account_id}
                          <ArrowUpRight className="size-3 text-muted-foreground" />
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] text-foreground bg-muted px-1.5 py-0.5 rounded-control">
                          {sig.signal_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-control border ${severityBadge(sig.severity)} capitalize`}>
                          {sig.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {sig.confidence_score ? `${Math.round(sig.confidence_score * 100)}%` : '100%'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-[11px]">
                        {new Date(sig.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedSignal(sig)}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Inspect JSON
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Signal Detail Modal */}
      {selectedSignal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-control border border-border bg-card p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Signal Details: {selectedSignal.signal_type}
                </h3>
                <p className="text-xs text-muted-foreground">ID: {selectedSignal.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSignal(null)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 p-2 rounded-control bg-muted/40 border border-border/60">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Domain:</span>
                  <span className="font-medium">{selectedSignal.domain || selectedSignal.account_id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Severity:</span>
                  <span className="font-medium capitalize">{selectedSignal.severity}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Source Event ID:</span>
                  <span className="font-mono text-[11px]">{selectedSignal.source_event_id || 'Direct'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Created At:</span>
                  <span>{new Date(selectedSignal.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  Metadata & Payload:
                </label>
                <pre className="p-3 rounded-control bg-zinc-950 text-zinc-100 font-mono text-[11px] overflow-x-auto max-h-60 border border-border">
                  {JSON.stringify(selectedSignal.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedSignal(null)}
                className="h-8 px-4 rounded-control border border-border bg-background hover:bg-muted text-xs font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
