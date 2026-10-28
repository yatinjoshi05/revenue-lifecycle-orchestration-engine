import React, { useState } from 'react';
import { useRloe } from '../context/RloeContext';
import { Header } from '../components/Header';
import { RloeMetricsCards } from '../components/RloeMetricsCards';
import { RloeAnalyticsCharts } from '../components/RloeAnalyticsCharts';
import { RloeTelemetryTable } from '../components/RloeTelemetryTable';
import { RloeArchitectureModal } from '../components/RloeArchitectureModal';
import {
  Activity,
  Radio,
  AlertTriangle,
  RotateCw,
  Plus,
  ShieldAlert,
  HelpCircle,
  X,
} from 'lucide-react';

interface TelemetryPageProps {
  onToggleMobileSidebar: () => void;
  onOpenSettings: () => void;
}

export const TelemetryPage: React.FC<TelemetryPageProps> = ({
  onToggleMobileSidebar,
  onOpenSettings,
}) => {
  const {
    telemetry,
    inboundLogs,
    errorLogs,
    isLoading,
    error,
    refreshData,
    simulateSignal,
  } = useRloe();

  const [activeTab, setActiveTab] = useState<'telemetry' | 'inbound' | 'errors'>('telemetry');
  const [architectureOpen, setArchitectureOpen] = useState(false);
  const [simulateModalOpen, setSimulateModalOpen] = useState(false);
  const [simDomain, setSimDomain] = useState('');
  const [simSource, setSimSource] = useState('webhook_gate');
  const [simMessage, setSimMessage] = useState<string | null>(null);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simDomain.trim()) return;
    const res = await simulateSignal(simDomain.trim(), simSource);
    setSimMessage(res.message);
    setSimDomain('');
    setTimeout(() => setSimMessage(null), 3500);
    setSimulateModalOpen(false);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background overflow-hidden relative">
      {/* Top Header */}
      <Header
        onToggleMobileSidebar={onToggleMobileSidebar}
        title="Operations"
        icon="telemetry"
        onOpenSettings={onOpenSettings}
      />

      {/* Main Operational Container */}
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5">
        {/* Banner if error */}
        {error && (
          <div className="p-3.5 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => refreshData()}
              className="font-medium underline hover:opacity-80"
            >
              Retry Connection
            </button>
          </div>
        )}

        {simMessage && (
          <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs">
            {simMessage}
          </div>
        )}

        {/* Action / Overview Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">RLOE Observability & Inbound Pipeline</h2>
            <p className="text-xs text-muted-foreground">
              Real-time monitoring of webhook signals, cache-first routing triage, and deterministic scoring.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setArchitectureOpen(true)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-control border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors"
            >
              <HelpCircle className="size-3.5 text-muted-foreground" />
              <span>4 Execution Lanes</span>
            </button>

            <button
              type="button"
              onClick={() => setSimulateModalOpen(true)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-control border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors"
            >
              <Plus className="size-3.5 text-muted-foreground" />
              <span>Simulate Signal</span>
            </button>

            <button
              type="button"
              onClick={() => refreshData()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-control border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors disabled:opacity-50"
              title="Refresh telemetry rows"
            >
              <RotateCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* 4 Required Metric Cards */}
        <RloeMetricsCards
          onOpenSettings={onOpenSettings}
          onOpenArchitecture={() => setArchitectureOpen(true)}
        />

        {/* Visual Analytics Charts (Route Distribution, Cache Efficiency, Score Benchmarks) */}
        <RloeAnalyticsCharts
          telemetry={telemetry}
          inboundLogs={inboundLogs}
        />

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-border text-xs">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('telemetry')}
              className={`pb-2.5 font-medium transition-colors border-b-2 -mb-px ${
                activeTab === 'telemetry'
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Activity className="size-3.5" />
                <span>Execution Telemetry ({telemetry.length})</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('inbound')}
              className={`pb-2.5 font-medium transition-colors border-b-2 -mb-px ${
                activeTab === 'inbound'
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Radio className="size-3.5" />
                <span>Inbound Intent Logs ({inboundLogs.length})</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('errors')}
              className={`pb-2.5 font-medium transition-colors border-b-2 -mb-px ${
                activeTab === 'errors'
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="size-3.5" />
                <span>System Error Log ({errorLogs.length})</span>
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 rounded-xl border border-border overflow-hidden bg-card min-h-[380px] flex flex-col">
          {activeTab === 'telemetry' && (
            <RloeTelemetryTable telemetry={telemetry} />
          )}

          {activeTab === 'inbound' && (
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-muted border-b border-border text-muted-foreground shadow-xs">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Domain</th>
                    <th className="py-2.5 px-3 font-medium">Source</th>
                    <th className="py-2.5 px-3 font-medium">Visitor ID</th>
                    <th className="py-2.5 px-3 font-medium">Campaign / UTM</th>
                    <th className="py-2.5 px-3 font-medium">Cache Result</th>
                    <th className="py-2.5 px-4 font-medium text-right">Received At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {inboundLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        No inbound intent records available.
                      </td>
                    </tr>
                  ) : (
                    inboundLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/40">
                        <td className="py-2.5 px-4 font-semibold text-foreground">{log.company_domain}</td>
                        <td className="py-2.5 px-3">
                          <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded border border-border">
                            {log.source}
                          </code>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                          {log.visitor_anonymous_id || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground text-[11px]">
                          {log.utm_campaign || log.utm_source || 'direct'}
                        </td>
                        <td className="py-2.5 px-3">
                          {log.cache_hit ? (
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Cache Hit</span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">New Inbound</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right text-[11px] text-muted-foreground">
                          {new Date(log.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'errors' && (
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-muted border-b border-border text-muted-foreground shadow-xs">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Execution ID</th>
                    <th className="py-2.5 px-3 font-medium">Workflow</th>
                    <th className="py-2.5 px-3 font-medium">Failing Node</th>
                    <th className="py-2.5 px-4 font-medium">Error Message</th>
                    <th className="py-2.5 px-4 font-medium text-right">Logged At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {errorLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        No error logs recorded. System running smoothly across all lanes.
                      </td>
                    </tr>
                  ) : (
                    errorLogs.map((err) => (
                      <tr key={err.id} className="hover:bg-muted/40">
                        <td className="py-2.5 px-4 font-mono text-[11px] text-foreground">{err.execution_id}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">{err.workflow_id}</td>
                        <td className="py-2.5 px-3 font-medium text-foreground">{err.node_name}</td>
                        <td className="py-2.5 px-4 text-destructive font-mono text-[11px]">{err.error_message}</td>
                        <td className="py-2.5 px-4 text-right text-[11px] text-muted-foreground">
                          {new Date(err.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 4 Execution Lanes Architecture Modal */}
      <RloeArchitectureModal
        open={architectureOpen}
        onClose={() => setArchitectureOpen(false)}
      />

      {/* Simulate Inbound Signal Modal */}
      {simulateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSimulateModalOpen(false)} />
          <div className="relative w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Simulate Inbound Signal</h3>
              <button
                type="button"
                onClick={() => setSimulateModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleSimulate} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Company Domain *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. acme.com or stripe.com"
                  value={simDomain}
                  onChange={(e) => setSimDomain(e.target.value)}
                  className="h-8 w-full rounded-control border border-input bg-background px-3 outline-none focus:border-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Source</label>
                <select
                  value={simSource}
                  onChange={(e) => setSimSource(e.target.value)}
                  className="h-8 w-full rounded-control border border-input bg-background px-2.5 outline-none focus:border-ring"
                >
                  <option value="webhook_gate">Webhook Inbound Gate (Lane A)</option>
                  <option value="plg_usage_poller">PLG Usage Poller (15m Cron)</option>
                  <option value="demo_request">High Intent Demo Request</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSimulateModalOpen(false)}
                  className="h-8 rounded-control border border-border px-3 text-xs hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-8 rounded-control bg-primary text-primary-foreground px-4 text-xs font-medium hover:bg-primary/90"
                >
                  Dispatch Signal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelemetryPage;
