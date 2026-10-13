import React from 'react';
import { useRloe } from '../context/RloeContext';
import { Radio, Zap, TrendingUp, Clock, ArrowRight, Database } from 'lucide-react';
import { formatMoney } from '../utils/format';

interface RloeMetricsCardsProps {
  onOpenSettings?: () => void;
  onOpenArchitecture?: () => void;
}

export const RloeMetricsCards: React.FC<RloeMetricsCardsProps> = ({
  onOpenSettings,
  onOpenArchitecture,
}) => {
  const { metrics, settings } = useRloe();

  const isConfigured = Boolean(settings.supabaseUrl && settings.supabaseAnonKey);

  return (
    <div className="space-y-3">
      {!isConfigured && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg border border-border bg-muted/40 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Database className="size-3.5 text-muted-foreground shrink-0" />
            <span>
              <strong>Database status:</strong> Not connected. Inbound signals will be logged locally until Supabase is configured.
            </span>
          </div>
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1 font-medium text-foreground hover:underline text-xs"
            >
              <span>Configure Database in Settings</span>
              <ArrowRight className="size-3" />
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Total Webhook Signals Ingested */}
        <div className="rounded-xl border border-border bg-card p-4 transition-all hover:border-border/80">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Total Signals Ingested</span>
            <div className="size-7 rounded-control bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Radio className="size-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight text-foreground">
              {metrics.totalSignalsIngested}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {metrics.totalSignalsIngested === 0 ? 'no signals yet' : 'inbound events'}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 truncate">
            Source: <code className="text-[10px] bg-muted px-1 py-0.5 rounded">inbound_intent_log</code>
          </p>
        </div>

        {/* Metric 2: Cache Triage Resolution Rate */}
        <div className="rounded-xl border border-border bg-card p-4 transition-all hover:border-border/80">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Cache Triage Resolution</span>
            <div className="size-7 rounded-control bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Zap className="size-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight text-foreground">
              {metrics.totalSignalsIngested === 0 ? '—' : `${metrics.cacheTriageResolutionRate}%`}
            </span>
            <span className="text-[11px] text-muted-foreground">resolved in Lane B</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Bypasses costly enrichment & LLM spend
          </p>
        </div>

        {/* Metric 3: Hot Sales Pipeline Velocity */}
        <div className="rounded-xl border border-border bg-card p-4 transition-all hover:border-border/80">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Estimated Pipeline Value</span>
            <div className="size-7 rounded-control bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp className="size-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight text-foreground">
              {formatMoney(metrics.estimatedPipelineVelocity)}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 truncate" title="Sales-priority accounts × $85,000 estimated deal value">
            {metrics.salesPriorityCount} priority accounts × $85k est.
          </p>
        </div>

        {/* Metric 4: Latency & Execution Efficiency */}
        <div className="rounded-xl border border-border bg-card p-4 transition-all hover:border-border/80">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Avg Execution Latency</span>
            <div className="size-7 rounded-control bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="size-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight text-foreground">
              {metrics.averageLatencyMs !== null ? `${metrics.averageLatencyMs}ms` : '—'}
            </span>
            <span className="text-[11px] text-muted-foreground">end-to-end</span>
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[11px] text-muted-foreground">
            <span>LLM Spend: ${metrics.llmTokenSpendUSD.toFixed(4)}</span>
            {onOpenArchitecture && (
              <button
                type="button"
                onClick={onOpenArchitecture}
                className="text-primary hover:underline text-[11px] font-medium"
              >
                View Lanes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RloeMetricsCards;
