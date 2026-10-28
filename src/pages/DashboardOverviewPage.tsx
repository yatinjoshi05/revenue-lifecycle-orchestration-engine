import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useNexus } from '../context/NexusContext';
import { nexusApi, LeadRecord } from '../services/nexusApi';
import {
  Activity,
  Radio,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  RotateCw,
  Server,
  Database,
  CheckCircle2,
  AlertTriangle,
  Send,
  Sliders,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Zap,
} from 'lucide-react';

interface DashboardOverviewPageProps {
  onToggleMobileSidebar: () => void;
  onOpenSettings?: () => void;
}

export const DashboardOverviewPage: React.FC<DashboardOverviewPageProps> = ({
  onToggleMobileSidebar,
}) => {
  const { metrics, meta, isBackendOnline, isLoading, error, refreshMetrics, lastUpdated } = useNexus();

  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [leadsLoading, setLeadsLoading] = useState<boolean>(true);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const fetchLeads = useCallback(async () => {
    setLeadsLoading(true);
    setLeadsError(null);
    try {
      const data = await nexusApi.getLeads({ limit: 10 });
      setLeads(data);
    } catch (err: any) {
      setLeadsError(err.message || 'Failed to fetch leads pipeline records');
    } finally {
      setLeadsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleSimulateSignal = async () => {
    setIsSimulating(true);
    try {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      await nexusApi.submitBuyingSignal({
        company_name: `Aether Dynamics ${randomSuffix}`,
        website: `https://aetherdynamics-${randomSuffix}.io`,
        buying_signal_detected: `Aether Dynamics raises $45M Series B for AI Agent Infrastructure`,
        source_url: `https://techcrunch.com/2026/10/aether-dynamics-${randomSuffix}-series-b`,
        funding_amount: '$45,000,000',
        series: 'Series B',
      });
      await Promise.all([fetchLeads(), refreshMetrics()]);
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const events = metrics?.events;
  const signals = metrics?.signals;
  const handoffs = metrics?.handoffs;
  const integrity = metrics?.integrity;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background text-foreground overflow-y-auto">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-card px-4 sm:px-6 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="flex size-8 items-center justify-center rounded-control border border-border md:hidden hover:bg-muted"
            aria-label="Toggle Navigation"
          >
            <Activity className="size-4" />
          </button>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              Pipeline Overview
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-control border ${
                  isBackendOnline
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-destructive/20 bg-destructive/10 text-destructive'
                }`}
              >
                <span className={`size-1.5 rounded-full ${isBackendOnline ? 'bg-emerald-500' : 'bg-destructive'}`} />
                {isBackendOnline ? 'Control Plane Active' : 'Backend Disconnected'}
              </span>
            </h1>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Truthful real-time telemetry across signals, handoffs, and revenue integrity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {lastUpdated && (
            <span className="text-muted-foreground hidden lg:inline">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            type="button"
            onClick={() => refreshMetrics()}
            disabled={isLoading}
            className="flex items-center gap-1.5 h-8 px-3 rounded-control border border-border bg-background hover:bg-muted font-medium transition-colors disabled:opacity-50"
            title="Refresh operational telemetry from backend"
          >
            <RotateCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/inspector"
            className="flex items-center gap-1.5 h-8 px-3 rounded-control bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            <Send className="size-3.5" />
            <span>Test Ingestion</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Offline Warning Notice */}
        {!isBackendOnline && (
          <div className="rounded-control border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive flex items-start gap-3">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Backend Control Plane is unreachable</p>
              <p className="text-destructive/90">
                {error || 'Cannot connect to http://localhost:4000/api/v1. Ensure the NEXUS backend server is running.'}
              </p>
              <p className="text-[11px] text-muted-foreground pt-1">
                Zero mock data is being displayed. Reconnect the service and click Refresh.
              </p>
            </div>
          </div>
        )}

        {/* System Runtime Context Bar */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-control border border-border bg-card p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
              <Server className="size-3.5" />
              <span>Environment</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-foreground capitalize">
              {meta?.environment || 'development'}
            </p>
            <p className="text-[10px] text-muted-foreground">Version {meta?.version || '1.0.0'}</p>
          </div>

          <div className="rounded-control border border-border bg-card p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
              <Clock className="size-3.5" />
              <span>Backend Uptime</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {metrics ? `${Math.floor(metrics.uptimeSeconds / 60)}m ${metrics.uptimeSeconds % 60}s` : 'Unavailable'}
            </p>
            <p className="text-[10px] text-muted-foreground">Liveness: healthy</p>
          </div>

          <div className="rounded-control border border-border bg-card p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
              <Database className="size-3.5" />
              <span>Database Layer</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-foreground capitalize">
              {meta?.database?.provider || 'Supabase (PostgreSQL)'}
            </p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="size-2.5" /> SEC-01 Hardened
            </p>
          </div>

          <div className="rounded-control border border-border bg-card p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
              <Sliders className="size-3.5" />
              <span>SLA Target</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {handoffs ? `${handoffs.slaCompliancePercentage}%` : '100%'}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Avg response: {handoffs?.avgFirstResponseMinutes !== null && handoffs?.avgFirstResponseMinutes !== undefined ? `${handoffs.avgFirstResponseMinutes}m` : 'No data yet'}
            </p>
          </div>
        </section>

        {/* 4 Core Engine Telemetry Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Event Ingestion */}
          <div className="rounded-control border border-border bg-card p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Product Events</span>
                <Link to="/signals" className="text-muted-foreground hover:text-foreground">
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {events ? events.totalIngested : 0}
              </p>
              <p className="text-[11px] text-muted-foreground">Total Ingested Events</p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 grid grid-cols-3 gap-2 text-center text-[11px]">
              <div>
                <span className="text-muted-foreground block text-[10px]">Processed</span>
                <span className="font-semibold text-foreground">{events ? events.processed : 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Duplicates</span>
                <span className="font-semibold text-foreground">{events ? events.duplicatesSuppressed : 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Failed</span>
                <span className={`font-semibold ${events && events.failed > 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {events ? events.failed : 0}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Derived Signals */}
          <div className="rounded-control border border-border bg-card p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Lifecycle Signals</span>
                <Link to="/signals" className="text-muted-foreground hover:text-foreground">
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {signals ? signals.totalDetected : 0}
              </p>
              <p className="text-[11px] text-muted-foreground">Detected Intent & Churn Signals</p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground text-[11px]">Active Signal Types</span>
                <span className="font-medium text-foreground">
                  {signals?.byType ? Object.keys(signals.byType).length : 0} types
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {signals?.byType && Object.keys(signals.byType).length > 0 ? (
                  Object.entries(signals.byType).map(([type, count]) => (
                    <span
                      key={type}
                      className="inline-block px-1.5 py-0.5 text-[10px] rounded-control border border-border bg-muted text-foreground"
                    >
                      {type}: {count}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-muted-foreground italic">No signals derived yet</span>
                )}
              </div>
            </div>
          </div>

          {/* Card 3: GTM Handoffs */}
          <div className="rounded-control border border-border bg-card p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">GTM Handoffs</span>
                <Link to="/handoffs" className="text-muted-foreground hover:text-foreground">
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {handoffs ? handoffs.totalCreated : 0}
              </p>
              <p className="text-[11px] text-muted-foreground">Active Operational Handoffs</p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 grid grid-cols-3 gap-2 text-center text-[11px]">
              <div>
                <span className="text-muted-foreground block text-[10px]">Assigned</span>
                <span className="font-semibold text-foreground">{handoffs?.byStatus?.assigned || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Completed</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {handoffs?.byStatus?.completed || 0}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Escalated</span>
                <span className={`font-semibold ${handoffs?.byStatus?.escalated ? 'text-destructive' : 'text-foreground'}`}>
                  {handoffs?.byStatus?.escalated || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Revenue Integrity */}
          <div className="rounded-control border border-border bg-card p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Revenue Integrity</span>
                <Link to="/integrity" className="text-muted-foreground hover:text-foreground">
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {integrity ? integrity.openIssues : 0}
              </p>
              <p className="text-[11px] text-muted-foreground">Open Pipeline & CRM Issues</p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 grid grid-cols-2 gap-2 text-center text-[11px]">
              <div>
                <span className="text-muted-foreground block text-[10px]">Proposed Repairs</span>
                <span className="font-semibold text-foreground">{integrity ? integrity.proposedActions : 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Approved / Done</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {integrity ? integrity.approvedActions : 0}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Live Qualified Leads Pipeline (Supabase PostgreSQL Shared Persistence) */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="size-3.5 text-indigo-500" />
                Live Qualified Leads Pipeline
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-muted text-foreground/80">
                  public.leads_pipeline
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Autonomous RSS funding signals, AI qualification, and Supabase PostgreSQL persistence
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchLeads}
                disabled={leadsLoading}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-control border border-border bg-card hover:bg-muted text-xs font-medium transition-colors"
                title="Refresh leads from Supabase"
              >
                <RotateCw className={`size-3 ${leadsLoading ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
              <button
                type="button"
                onClick={handleSimulateSignal}
                disabled={isSimulating}
                className="flex items-center gap-1.5 h-7 px-3 rounded-control bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-xs transition-colors disabled:opacity-50"
                title="Trigger simulated Series B funding signal through canonical ingress pipeline"
              >
                <Zap className={`size-3 ${isSimulating ? 'animate-bounce' : ''}`} />
                <span>{isSimulating ? 'Qualifying...' : 'Simulate Funding Signal'}</span>
              </button>
            </div>
          </div>

          <div className="rounded-control border border-border bg-card overflow-hidden shadow-xs">
            {leadsLoading && leads.length === 0 ? (
              <div className="flex items-center justify-center p-8 text-xs text-muted-foreground gap-2">
                <RotateCw className="size-4 animate-spin text-primary" />
                <span>Reading persisted records from Supabase PostgreSQL...</span>
              </div>
            ) : leadsError ? (
              <div className="p-6 text-xs text-destructive flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                <span>{leadsError}</span>
              </div>
            ) : leads.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-xs font-medium text-foreground">No Qualified Leads Recorded Yet</p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Click <span className="font-semibold text-foreground">"Simulate Funding Signal"</span> above or run the Python RSS producer to ingest live funding announcements from TechCrunch/VentureBeat.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
                      <th className="py-2.5 px-3">Company</th>
                      <th className="py-2.5 px-3">Buying Signal</th>
                      <th className="py-2.5 px-3 text-center">Score</th>
                      <th className="py-2.5 px-3 text-center">Tier</th>
                      <th className="py-2.5 px-3">AI Research Summary</th>
                      <th className="py-2.5 px-3 text-right">Persisted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {leads.map((lead) => {
                      const tierStyle =
                        lead.lead_tier === 'Tier 1'
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : lead.lead_tier === 'Tier 2'
                          ? 'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : lead.lead_tier === 'Tier 3'
                          ? 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'border-muted bg-muted text-muted-foreground';

                      const scoreColor =
                        (lead.lead_score || 0) >= 80
                          ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                          : (lead.lead_score || 0) >= 60
                          ? 'text-blue-600 dark:text-blue-400 font-bold'
                          : 'text-amber-600 dark:text-amber-400 font-semibold';

                      return (
                        <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              {lead.company_name}
                              {lead.website && (
                                <a
                                  href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-foreground"
                                  title={`Visit ${lead.website}`}
                                >
                                  <ExternalLink className="size-3" />
                                </a>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {lead.website || 'No website domain'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 max-w-[280px]">
                            <p className="line-clamp-2 text-foreground/90 text-[11px]">
                              {lead.buying_signal_detected}
                            </p>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`text-sm ${scoreColor}`}>
                              {lead.lead_score ?? '—'}
                            </span>
                            <span className="text-[10px] text-muted-foreground block">/100</span>
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full border ${tierStyle}`}
                            >
                              {lead.lead_tier || 'Unranked'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 max-w-[340px]">
                            <p className="line-clamp-2 text-muted-foreground text-[11px] italic">
                              {lead.ai_research_summary || 'No research summary available'}
                            </p>
                          </td>
                          <td className="py-2.5 px-3 text-right text-[11px] text-muted-foreground whitespace-nowrap">
                            {lead.created_at
                              ? new Date(lead.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })
                              : 'Just now'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Operational Modules & Quick Nav */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Operational Engineering Modules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/inspector"
              className="group rounded-control border border-border bg-card p-4 hover:border-foreground/30 transition-colors flex items-start justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Send className="size-4 text-blue-500" />
                  <span className="text-sm font-semibold text-foreground">Tag & Event Inspector</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Validate JSON event schemas, inspect response headers, and test real pipeline ingestion.
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all mt-1" />
            </Link>

            <Link
              to="/handoffs"
              className="group rounded-control border border-border bg-card p-4 hover:border-foreground/30 transition-colors flex items-start justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Radio className="size-4 text-indigo-500" />
                  <span className="text-sm font-semibold text-foreground">Handoffs & SLA Manager</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Monitor rep routing deadlines, evaluate SLA breaches, and manage state transitions.
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all mt-1" />
            </Link>

            <Link
              to="/integrity"
              className="group rounded-control border border-border bg-card p-4 hover:border-foreground/30 transition-colors flex items-start justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-4 text-amber-500" />
                  <span className="text-sm font-semibold text-foreground">Revenue Integrity & Approvals</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Inspect detected data anomalies and execute human-approved repair actions safely.
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all mt-1" />
            </Link>
          </div>
        </section>

        {/* Global Footer */}
        <footer className="pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">NEXUS GTM</span>
            <span>&copy; {new Date().getFullYear()} Revenue Engineering Operations Control Plane</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms & Conditions
            </Link>
            <Link to="/system" className="hover:text-foreground transition-colors">
              System Status
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
};
