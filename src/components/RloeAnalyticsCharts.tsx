import React from 'react';
import { RloeTelemetry, InboundIntentLog } from '../types/rloe';
import { BarChart3, PieChart, Zap, Cpu, TrendingUp, Layers } from 'lucide-react';
import { formatMoney } from '../utils/format';

interface RloeAnalyticsChartsProps {
  telemetry: RloeTelemetry[];
  inboundLogs: InboundIntentLog[];
}

export const RloeAnalyticsCharts: React.FC<RloeAnalyticsChartsProps> = ({
  telemetry,
  inboundLogs,
}) => {
  if (telemetry.length === 0 && inboundLogs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-center">
        <div className="mx-auto flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
          <BarChart3 className="size-4.5" />
        </div>
        <h4 className="text-xs font-semibold text-foreground">No Telemetry Events Recorded Yet</h4>
        <p className="text-[11px] text-muted-foreground max-w-sm mx-auto mt-1">
          Visual distribution charts and execution analytics will calculate automatically as signals arrive through your Webhook Gate or PLG Poller.
        </p>
      </div>
    );
  }

  // 1. Calculate Route Distribution
  const priorityCount = telemetry.filter((t) => t.route === 'sales_priority').length;
  const reviewCount = telemetry.filter((t) => t.route === 'needs_review').length;
  const disqualifiedCount = telemetry.filter((t) => t.route === 'disqualified').length;
  const totalTelemetry = telemetry.length || 1;

  const priorityPct = Math.round((priorityCount / totalTelemetry) * 100);
  const reviewPct = Math.round((reviewCount / totalTelemetry) * 100);
  const disqualifiedPct = Math.max(0, 100 - priorityPct - reviewPct);

  // 2. Source Breakdown
  const sourcesMap: Record<string, number> = {};
  inboundLogs.forEach((log) => {
    const src = log.source || 'unknown';
    sourcesMap[src] = (sourcesMap[src] || 0) + 1;
  });
  const sourceEntries = Object.entries(sourcesMap);

  // 3. Cache vs Enriched Triage
  const cacheHits = telemetry.filter((t) => t.cache_hit).length;
  const newLeads = telemetry.filter((t) => !t.cache_hit).length;

  // 4. Average Scores
  const scoredItems = telemetry.filter((t) => typeof t.icp_fit_score === 'number');
  const avgIcp = scoredItems.length > 0
    ? Math.round(scoredItems.reduce((acc, t) => acc + (t.icp_fit_score || 0), 0) / scoredItems.length)
    : null;

  const intentItems = telemetry.filter((t) => typeof t.intent_strength_score === 'number');
  const avgIntent = intentItems.length > 0
    ? Math.round(intentItems.reduce((acc, t) => acc + (t.intent_strength_score || 0), 0) / intentItems.length)
    : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Chart Card 1: Route Distribution Breakdown */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <PieChart className="size-3.5 text-blue-500" />
            Routing Decision Distribution
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">{telemetry.length} evaluated</span>
        </div>

        {/* Multi-segment stacked progress bar */}
        <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
          {priorityPct > 0 && (
            <div
              style={{ width: `${priorityPct}%` }}
              className="bg-emerald-500 transition-all duration-300"
              title={`Sales Priority: ${priorityCount} (${priorityPct}%)`}
            />
          )}
          {reviewPct > 0 && (
            <div
              style={{ width: `${reviewPct}%` }}
              className="bg-amber-500 transition-all duration-300"
              title={`Needs Review: ${reviewCount} (${reviewPct}%)`}
            />
          )}
          {disqualifiedPct > 0 && (
            <div
              style={{ width: `${disqualifiedPct}%` }}
              className="bg-zinc-400 dark:bg-zinc-600 transition-all duration-300"
              title={`Disqualified: ${disqualifiedCount} (${disqualifiedPct}%)`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-1 text-[11px] pt-1 border-t border-border/60">
          <div>
            <div className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground text-[10px]">Priority</span>
            </div>
            <span className="font-semibold text-foreground">{priorityCount} ({priorityPct}%)</span>
          </div>

          <div>
            <div className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-amber-500" />
              <span className="text-muted-foreground text-[10px]">Review</span>
            </div>
            <span className="font-semibold text-foreground">{reviewCount} ({reviewPct}%)</span>
          </div>

          <div>
            <div className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-zinc-400 dark:bg-zinc-600" />
              <span className="text-muted-foreground text-[10px]">Disqualified</span>
            </div>
            <span className="font-semibold text-foreground">{disqualifiedCount} ({disqualifiedPct}%)</span>
          </div>
        </div>
      </div>

      {/* Chart Card 2: Lane B Cache vs Lane C Enrichment Triage */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Zap className="size-3.5 text-emerald-500" />
            Lane B Cache Efficiency
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {cacheHits} hits / {newLeads} new
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div>
            <div className="flex justify-between text-[11px] mb-1 text-muted-foreground">
              <span>Cache Hits (Instant Returning Leads)</span>
              <span className="font-semibold text-foreground">
                {telemetry.length > 0 ? Math.round((cacheHits / telemetry.length) * 100) : 0}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                style={{ width: `${telemetry.length > 0 ? (cacheHits / telemetry.length) * 100 : 0}%` }}
                className="h-full bg-emerald-500 rounded-full"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1 text-muted-foreground">
              <span>New Ingested (Full Enrichment & LLM)</span>
              <span className="font-semibold text-foreground">
                {telemetry.length > 0 ? Math.round((newLeads / telemetry.length) * 100) : 0}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                style={{ width: `${telemetry.length > 0 ? (newLeads / telemetry.length) * 100 : 0}%` }}
                className="h-full bg-purple-500 rounded-full"
              />
            </div>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/60">
          Cache hits eliminate Claude/NVIDIA token expenditure and Clay lookups completely.
        </p>
      </div>

      {/* Chart Card 3: Model Scoring Metrics */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Cpu className="size-3.5 text-purple-500" />
            Avg Score Benchmarks
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">Deterministic + AI</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center pt-1">
          <div className="p-2.5 rounded-lg border border-border/80 bg-muted/30">
            <span className="text-[10px] text-muted-foreground uppercase font-medium block">Avg ICP Fit</span>
            <span className="text-xl font-bold text-foreground">
              {avgIcp !== null ? `${avgIcp}/100` : '—'}
            </span>
          </div>

          <div className="p-2.5 rounded-lg border border-border/80 bg-muted/30">
            <span className="text-[10px] text-muted-foreground uppercase font-medium block">Avg Intent</span>
            <span className="text-xl font-bold text-foreground">
              {avgIntent !== null ? `${avgIntent}/100` : '—'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
          <span>Inbound Sources:</span>
          <span className="font-mono text-foreground font-medium">{sourceEntries.length || 0} active</span>
        </div>
      </div>
    </div>
  );
};

export default RloeAnalyticsCharts;
