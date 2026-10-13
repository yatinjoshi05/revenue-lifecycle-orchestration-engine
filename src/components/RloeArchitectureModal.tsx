import React, { useEffect } from 'react';
import { X, ArrowRight, ShieldCheck, Zap, Cpu, Database, CheckCircle2, AlertTriangle } from 'lucide-react';

interface RloeArchitectureModalProps {
  open: boolean;
  onClose: () => void;
}

export const RloeArchitectureModal: React.FC<RloeArchitectureModalProps> = ({ open, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-2xl z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">RLOE Architecture & Execution Lanes</h2>
            <p className="text-xs text-muted-foreground">
              Canonical 4-lane inbound signal orchestration, cache-first triage, and deterministic AI routing model.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-7 rounded-control flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground"
            aria-label="Close architecture view"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* 4 Lanes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Lane A */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <ShieldCheck className="size-4" />
                LANE A — Signal Ingestion
              </span>
              <span className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-mono">
                15m Poller + Webhook Gate
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Inbound signals arrive through the <strong>Webhook Inbound Gate</strong> or <strong>PLG Usage Poller</strong>. Passes through <strong>Payload Verification Parser</strong> which normalizes domains and strips disposable/public webmail.
            </p>
            <div className="p-2 rounded bg-background border border-border text-[11px] font-mono space-y-1">
              <div>• Sources: Webhook, PLG Usage, Forms</div>
              <div>• Output: company_domain, visitor_anonymous_id, signals</div>
              <div>• DB Sink: <code className="text-blue-600 dark:text-blue-400 font-bold">inbound_intent_log</code></div>
            </div>
          </div>

          {/* Lane B */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Zap className="size-4" />
                LANE B — Cache-First Routing
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                Sub-100ms Triage
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Executes a Supabase cache lookup on <code>inbound_intent_log</code>. Returning leads bypass expensive Clay enrichment and LLM token spend, instantly routing to HubSpot returning tasks.
            </p>
            <div className="p-2 rounded bg-background border border-border text-[11px] font-mono space-y-1">
              <div>• Supabase Cache Check</div>
              <div>• Is Lead New? → Yes: Lane C | No: Route Directly</div>
              <div>• Cost Reduction: 100% LLM tokens saved on cache hit</div>
            </div>
          </div>

          {/* Lane C */}
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <Cpu className="size-4" />
                LANE C — Enrichment & AI Scoring
              </span>
              <span className="text-[10px] bg-purple-500/10 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-mono">
                Cost Guardrails
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Triggers Clay waterfall enrichment followed by <strong>Deterministic Pre-Filter</strong> (headcount, revenue, tech stack). Only leads passing the pre-filter invoke the Claude/NVIDIA GTM Router.
            </p>
            <div className="p-2 rounded bg-background border border-border text-[11px] font-mono space-y-1">
              <div>• Clay Callback Webhook</div>
              <div>• Deterministic Pre-Score (0-100)</div>
              <div>• Worth Spending LLM Tokens? → Claude GTM Router</div>
            </div>
          </div>

          {/* Lane D */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Database className="size-4" />
                LANE D — CRM Sync & Telemetry
              </span>
              <span className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-mono">
                HubSpot + Observability
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Assigns lead to <code>sales_priority</code>, <code>needs_review</code>, or <code>disqualified</code>. Dispatches HubSpot tasks, creates high-value CRM opportunities, and logs operational telemetry and errors.
            </p>
            <div className="p-2 rounded bg-background border border-border text-[11px] font-mono space-y-1">
              <div>• High-Value Deal Sync → Opportunities Board</div>
              <div>• Observability Table: <code className="text-amber-600 dark:text-amber-400 font-bold">rloe_telemetry</code></div>
              <div>• Error Handling: <code className="text-red-500 font-bold">system_error_log</code></div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-muted-foreground">
          <span>RLOE Canonical Engine v2.4 • Enterprise Architecture</span>
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 rounded-control bg-primary text-primary-foreground font-medium hover:bg-primary/90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default RloeArchitectureModal;
