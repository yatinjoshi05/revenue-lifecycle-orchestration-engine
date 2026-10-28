import React, { useState } from 'react';
import { nexusApi } from '../services/nexusApi';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Code,
  FileJson,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface TagInspectorPageProps {
  onToggleMobileSidebar: () => void;
}

const SAMPLE_PAYLOADS: Record<string, { eventName: string; domain: string; properties: any }> = {
  workspace_created: {
    eventName: 'workspace_created',
    domain: 'nexus-demo.io',
    properties: {
      plan: 'enterprise_trial',
      seats_invited: 8,
      region: 'us-east-1',
    },
  },
  feature_used: {
    eventName: 'feature_used',
    domain: 'nexus-demo.io',
    properties: {
      feature: 'ai_revenue_copilot',
      session_duration_sec: 420,
      usage_count: 35,
    },
  },
  quota_exceeded: {
    eventName: 'quota_exceeded',
    domain: 'nexus-demo.io',
    properties: {
      metric: 'monthly_api_calls',
      threshold: 100000,
      current_usage: 108500,
    },
  },
  billing_plan_downgrade: {
    eventName: 'billing_plan_downgrade',
    domain: 'nexus-demo.io',
    properties: {
      previous_tier: 'enterprise',
      new_tier: 'free',
      reason: 'budget_cut',
    },
  },
};

export const TagInspectorPage: React.FC<TagInspectorPageProps> = ({
  onToggleMobileSidebar,
}) => {
  const [selectedSample, setSelectedSample] = useState('workspace_created');
  const [domain, setDomain] = useState(SAMPLE_PAYLOADS.workspace_created.domain);
  const [eventName, setEventName] = useState(SAMPLE_PAYLOADS.workspace_created.eventName);
  const [idempotencyKey, setIdempotencyKey] = useState(`evt_inspect_${Date.now()}`);
  const [propertiesJson, setPropertiesJson] = useState(
    JSON.stringify(SAMPLE_PAYLOADS.workspace_created.properties, null, 2)
  );

  const [parseError, setParseError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestLatencyMs, setRequestLatencyMs] = useState<number | null>(null);

  const handleSelectSample = (sampleKey: string) => {
    setSelectedSample(sampleKey);
    const sample = SAMPLE_PAYLOADS[sampleKey];
    if (sample) {
      setDomain(sample.domain);
      setEventName(sample.eventName);
      setPropertiesJson(JSON.stringify(sample.properties, null, 2));
      setIdempotencyKey(`evt_inspect_${Date.now()}`);
      setParseError(null);
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(propertiesJson);
      setPropertiesJson(JSON.stringify(parsed, null, 2));
      setParseError(null);
    } catch (e: any) {
      setParseError(e.message);
    }
  };

  const handleValidateJson = (val: string) => {
    setPropertiesJson(val);
    try {
      JSON.parse(val);
      setParseError(null);
    } catch (e: any) {
      setParseError(e.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim() || !eventName.trim()) {
      setRequestError('Domain and Event Name are required fields');
      return;
    }

    let parsedProps = {};
    try {
      parsedProps = JSON.parse(propertiesJson);
    } catch (e: any) {
      setParseError(`Cannot submit: Invalid JSON syntax in properties (${e.message})`);
      return;
    }

    setIsSubmitting(true);
    setRequestError(null);
    setSubmissionResult(null);

    const startTime = performance.now();
    try {
      const res = await nexusApi.ingestEvent({
        idempotencyKey: idempotencyKey.trim() || `evt_${Date.now()}`,
        domain: domain.trim().toLowerCase(),
        eventName: eventName.trim(),
        properties: parsedProps,
      });
      setRequestLatencyMs(Math.round(performance.now() - startTime));
      setSubmissionResult(res);
      // Auto-refresh idempotency key for next run
      setIdempotencyKey(`evt_inspect_${Date.now()}`);
    } catch (err: any) {
      setRequestLatencyMs(Math.round(performance.now() - startTime));
      setRequestError(err.message || 'Event ingestion failed on backend');
    } finally {
      setIsSubmitting(false);
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
            <Send className="size-4" />
          </button>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              Tag & Event Inspector
              <span className="px-2 py-0.5 text-[11px] font-medium rounded-control border border-border bg-muted">
                Pipeline Testing
              </span>
            </h1>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Validate event schemas, test atomic ingestion, and inspect derived signals
            </p>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Sample Payload Presets */}
        <section className="rounded-control border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <FileJson className="size-4 text-blue-500" />
              Pre-configured Event Presets (Test Fixtures Only)
            </span>
            <span className="text-[11px] text-muted-foreground">Select to load into editor</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.keys(SAMPLE_PAYLOADS).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectSample(key)}
                className={`text-left p-2.5 rounded-control border text-xs transition-colors ${
                  selectedSample === key
                    ? 'border-primary bg-muted font-medium text-foreground'
                    : 'border-border bg-background hover:bg-muted/50 text-muted-foreground'
                }`}
              >
                <span className="font-mono text-[11px] block text-foreground truncate">{key}</span>
                <span className="text-[10px] text-muted-foreground block truncate">
                  {SAMPLE_PAYLOADS[key].domain}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* 2-Column Split: Editor and Response Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Event Ingestion Form */}
          <form onSubmit={handleSubmit} className="rounded-control border border-border bg-card p-4 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Code className="size-4 text-indigo-500" />
                  Request Payload Configuration
                </span>
                <button
                  type="button"
                  onClick={handleFormatJson}
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  Format JSON
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground block">
                    Account Domain *
                  </label>
                  <input
                    type="text"
                    required
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="e.g. acme.com"
                    className="h-8 w-full rounded-control border border-input bg-background px-3 text-xs outline-none focus:border-ring"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground block">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="e.g. workspace_created"
                    className="h-8 w-full rounded-control border border-input bg-background px-3 text-xs outline-none focus:border-ring font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Idempotency Key (Header: Idempotency-Key)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIdempotencyKey(`evt_inspect_${Date.now()}`)}
                    className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <RotateCcw className="size-2.5" /> Generate New
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={idempotencyKey}
                  onChange={(e) => setIdempotencyKey(e.target.value)}
                  className="h-8 w-full rounded-control border border-input bg-background px-3 text-xs outline-none focus:border-ring font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground block">
                  Event Properties (JSON Payload)
                </label>
                <textarea
                  rows={8}
                  value={propertiesJson}
                  onChange={(e) => handleValidateJson(e.target.value)}
                  className="w-full rounded-control border border-input bg-zinc-950 p-3 text-xs font-mono text-zinc-100 outline-none focus:border-ring"
                />
                {parseError && (
                  <p className="text-[11px] text-destructive flex items-center gap-1 mt-1">
                    <AlertTriangle className="size-3" /> {parseError}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                POST /api/v1/events
              </span>
              <button
                type="submit"
                disabled={isSubmitting || !!parseError}
                className="h-8 px-4 rounded-control bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 flex items-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                <Send className={`size-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                <span>{isSubmitting ? 'Ingesting...' : 'Ingest Event'}</span>
              </button>
            </div>
          </form>

          {/* Column 2: Response & Verification Details */}
          <div className="rounded-control border border-border bg-card p-4 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Layers className="size-4 text-emerald-500" />
                  Ingestion Execution Result
                </span>
                {requestLatencyMs !== null && (
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Latency: {requestLatencyMs}ms
                  </span>
                )}
              </div>

              {requestError && (
                <div className="rounded-control border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="size-3.5" /> Ingestion Error
                  </p>
                  <p>{requestError}</p>
                </div>
              )}

              {submissionResult ? (
                <div className="space-y-3 text-xs">
                  <div className="rounded-control border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-700 dark:text-emerald-300 space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="size-4 text-emerald-500" />
                      Event Successfully Ingested & Evaluated
                    </p>
                    <p className="text-[11px]">
                      Atomic transaction committed to PostgreSQL database.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-control bg-muted/40 border border-border/60 text-[11px]">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Event ID:</span>
                      <span className="font-mono text-foreground">{submissionResult.eventId}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Processing Status:</span>
                      <span className="font-medium capitalize text-emerald-600 dark:text-emerald-400">
                        {submissionResult.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Derived Signals:</span>
                      <span className="font-bold text-foreground">{submissionResult.signalsCount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Lifecycle Stage:</span>
                      <span className="font-medium text-foreground capitalize">
                        {submissionResult.newLifecycleStage || 'unchanged'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground block mb-1">
                      Raw Server Response Payload:
                    </span>
                    <pre className="p-3 rounded-control bg-zinc-950 text-zinc-100 font-mono text-[11px] overflow-x-auto border border-border">
                      {JSON.stringify(submissionResult, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                  <Send className="size-6 mx-auto text-muted-foreground/60" />
                  <p>Awaiting event submission.</p>
                  <p className="text-[11px] max-w-xs mx-auto">
                    Fill out the form on the left or select a preset and click &quot;Ingest Event&quot; to test real database persistence.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Atomic Idempotency Active</span>
              <span>Positional Bindings Verified</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
