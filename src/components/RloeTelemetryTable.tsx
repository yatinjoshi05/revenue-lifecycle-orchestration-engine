import React, { useState } from 'react';
import { RloeTelemetry } from '../types/rloe';
import { RloeStatusBadge } from './RloeStatusBadge';
import { Search, Filter, Cpu, Check, X, ChevronRight, Layers, ArrowUpDown } from 'lucide-react';

interface RloeTelemetryTableProps {
  telemetry: RloeTelemetry[];
  onSelectRow?: (item: RloeTelemetry) => void;
  selectedId?: string;
}

export const RloeTelemetryTable: React.FC<RloeTelemetryTableProps> = ({
  telemetry,
  onSelectRow,
  selectedId,
}) => {
  const [search, setSearch] = useState('');
  const [routeFilter, setRouteFilter] = useState<'all' | 'sales_priority' | 'needs_review' | 'disqualified'>('all');
  const [cacheFilter, setCacheFilter] = useState<'all' | 'cache_hit' | 'new_lead'>('all');
  const [activeItem, setActiveItem] = useState<RloeTelemetry | null>(null);

  const filtered = telemetry.filter((item) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchDomain = item.company_domain.toLowerCase().includes(q);
      const matchSource = item.source.toLowerCase().includes(q);
      const matchLlm = (item.llm_model || '').toLowerCase().includes(q);
      if (!matchDomain && !matchSource && !matchLlm) return false;
    }

    if (routeFilter !== 'all' && item.route !== routeFilter) return false;

    if (cacheFilter === 'cache_hit' && !item.cache_hit) return false;
    if (cacheFilter === 'new_lead' && item.cache_hit) return false;

    return true;
  });

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background">
      {/* Table Subheader / Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2 bg-muted/20">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by domain, source, or model…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-control border border-input bg-background pl-8 pr-3 text-xs outline-none focus:border-ring placeholder:text-muted-foreground/70"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Route filter selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="size-3.5 text-muted-foreground" />
            <select
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value as any)}
              className="h-8 rounded-control border border-input bg-background px-2.5 text-xs outline-none focus:border-ring"
            >
              <option value="all">All Routes ({telemetry.length})</option>
              <option value="sales_priority">Sales Priority</option>
              <option value="needs_review">Needs Review</option>
              <option value="disqualified">Disqualified</option>
            </select>
          </div>

          {/* Cache hit selector */}
          <select
            value={cacheFilter}
            onChange={(e) => setCacheFilter(e.target.value as any)}
            className="h-8 rounded-control border border-input bg-background px-2.5 text-xs outline-none focus:border-ring"
          >
            <option value="all">All Inbound</option>
            <option value="cache_hit">Cache Hits (Lane B)</option>
            <option value="new_lead">Enriched New Leads</option>
          </select>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[900px]">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur-xs border-b border-border z-10 text-muted-foreground select-none">
            <tr>
              <th className="py-2.5 px-4 font-medium">Company Domain</th>
              <th className="py-2.5 px-3 font-medium">Route / Status</th>
              <th className="py-2.5 px-3 font-medium">Source</th>
              <th className="py-2.5 px-3 font-medium text-center">Prefilter</th>
              <th className="py-2.5 px-3 font-medium text-center">ICP Fit</th>
              <th className="py-2.5 px-3 font-medium text-center">Intent</th>
              <th className="py-2.5 px-3 font-medium">Cache Triage</th>
              <th className="py-2.5 px-3 font-medium">LLM Router</th>
              <th className="py-2.5 px-3 font-medium text-right">Latency</th>
              <th className="py-2.5 px-4 font-medium text-right">Processed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Layers className="size-6 text-muted-foreground/50 mb-1" />
                    <p className="text-xs font-medium text-foreground">No telemetry entries found</p>
                    <p className="text-[11px]">Adjust your filters or verify incoming signals in Lane A.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const isSelected = selectedId === row.id || activeItem?.id === row.id;
                return (
                  <tr
                    key={row.id}
                    onClick={() => {
                      setActiveItem(row);
                      onSelectRow?.(row);
                    }}
                    className={`hover:bg-muted/40 cursor-pointer transition-colors ${
                      isSelected ? 'bg-muted/70' : ''
                    }`}
                  >
                    {/* Company Domain */}
                    <td className="py-2.5 px-4 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[160px] font-semibold">{row.company_domain}</span>
                        {row.calculated_churn_risk_level && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                              row.calculated_churn_risk_level === 'low'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : row.calculated_churn_risk_level === 'medium'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-red-500/10 text-red-600 dark:text-red-400'
                            }`}
                          >
                            Risk: {row.calculated_churn_risk_level}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Route Badge */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <RloeStatusBadge route={row.route} />
                    </td>

                    {/* Source */}
                    <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                      <code className="text-[11px] bg-muted/60 px-1.5 py-0.5 rounded border border-border/50">
                        {row.source}
                      </code>
                    </td>

                    {/* Prefilter Score */}
                    <td className="py-2.5 px-3 text-center">
                      {row.prefilter_score !== null && row.prefilter_score !== undefined ? (
                        <span className="font-mono text-xs">{row.prefilter_score}/100</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* ICP Fit */}
                    <td className="py-2.5 px-3 text-center">
                      {row.icp_fit_score !== null && row.icp_fit_score !== undefined ? (
                        <span className="font-mono text-xs font-medium text-foreground">{row.icp_fit_score}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Intent Strength */}
                    <td className="py-2.5 px-3 text-center">
                      {row.intent_strength_score !== null && row.intent_strength_score !== undefined ? (
                        <span className="font-mono text-xs font-medium text-foreground">{row.intent_strength_score}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Cache Triage */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {row.cache_hit ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <Check className="size-3" />
                          <span>Cache Hit</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">New Lead</span>
                      )}
                    </td>

                    {/* LLM Router */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {row.llm_called ? (
                        <div className="flex items-center gap-1.5">
                          <Cpu className="size-3 text-purple-600 dark:text-purple-400 shrink-0" />
                          <span className="truncate max-w-[120px] text-[11px] text-muted-foreground font-mono">
                            {row.llm_model?.replace('claude-3-5-', '').replace('20241022', '') || 'LLM Invoked'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Bypassed (Saved $$)</span>
                      )}
                    </td>

                    {/* Latency */}
                    <td className="py-2.5 px-3 text-right font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      {row.total_ms || row.latency_ms ? `${row.total_ms || row.latency_ms}ms` : '—'}
                    </td>

                    {/* Processed Timestamp */}
                    <td className="py-2.5 px-4 text-right text-[11px] text-muted-foreground whitespace-nowrap">
                      {row.created_at ? new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Row Detail Drawer (when user clicks an item) */}
      {activeItem && (
        <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-border bg-card shadow-2xl p-6 overflow-y-auto space-y-5 animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-base font-semibold text-foreground">{activeItem.company_domain}</h3>
              <p className="text-xs text-muted-foreground">RLOE Telemetry Detail Record</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveItem(null)}
              className="size-7 rounded-control flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Routing Decision */}
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
              <span className="font-semibold text-foreground">Routing Outcome</span>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Assigned Route:</span>
                <RloeStatusBadge route={activeItem.route} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Outcome Stage:</span>
                <span className="font-mono">{activeItem.stage || 'crm_sync'}</span>
              </div>
              {activeItem.reasoning_summary && (
                <div className="mt-2 pt-2 border-t border-border text-muted-foreground leading-relaxed">
                  <strong className="text-foreground font-medium">Scoring Rationale:</strong> {activeItem.reasoning_summary}
                </div>
              )}
            </div>

            {/* Lane Performance & Cost */}
            <div className="space-y-2">
              <span className="font-semibold text-foreground">Execution & Cost Telemetry</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg border border-border bg-background">
                  <span className="text-muted-foreground text-[11px] block">Total Duration</span>
                  <span className="font-semibold text-sm">{activeItem.total_ms || activeItem.latency_ms || 0} ms</span>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-background">
                  <span className="text-muted-foreground text-[11px] block">Est. Cost</span>
                  <span className="font-semibold text-sm">${(activeItem.est_cost_usd || 0).toFixed(4)}</span>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-background">
                  <span className="text-muted-foreground text-[11px] block">LLM Called</span>
                  <span className="font-semibold text-sm">{activeItem.llm_called ? 'Yes' : 'No (Cost Saved)'}</span>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-background">
                  <span className="text-muted-foreground text-[11px] block">Cache Status</span>
                  <span className="font-semibold text-sm">{activeItem.cache_hit ? 'Lane B Hit' : 'New Ingestion'}</span>
                </div>
              </div>
            </div>

            {/* Token Usage Breakdown */}
            {activeItem.llm_called && (
              <div className="rounded-lg border border-border p-3 space-y-1.5">
                <span className="font-semibold text-foreground">Token Consumption</span>
                <div className="flex justify-between text-muted-foreground">
                  <span>Input Tokens:</span>
                  <span className="font-mono text-foreground">{activeItem.input_tokens || 0}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Output Tokens:</span>
                  <span className="font-mono text-foreground">{activeItem.output_tokens || 0}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>LLM Model:</span>
                  <span className="font-mono text-foreground">{activeItem.llm_model || 'Standard GTM Router'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RloeTelemetryTable;
