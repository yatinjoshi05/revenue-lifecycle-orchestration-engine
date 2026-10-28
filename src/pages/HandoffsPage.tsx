import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { nexusApi, GtmHandoff } from '../services/nexusApi';
import {
  Radio,
  Clock,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  ArrowUpRight,
  UserCheck,
  Check,
  ShieldAlert,
  Play,
  Layers,
} from 'lucide-react';

interface HandoffsPageProps {
  onToggleMobileSidebar: () => void;
}

export const HandoffsPage: React.FC<HandoffsPageProps> = ({
  onToggleMobileSidebar,
}) => {
  const [handoffs, setHandoffs] = useState<GtmHandoff[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [evaluatingSla, setEvaluatingSla] = useState(false);
  const [slaResultMsg, setSlaResultMsg] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchHandoffs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await nexusApi.getHandoffs({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        targetRole: roleFilter !== 'all' ? roleFilter : undefined,
      });
      setHandoffs(data);
    } catch (err: any) {
      console.warn('Failed to fetch handoffs:', err.message);
      setError(err.message || 'Error fetching handoffs from backend');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, roleFilter]);

  useEffect(() => {
    fetchHandoffs();
  }, [fetchHandoffs]);

  const handleRecordFirstResponse = async (id: string) => {
    try {
      await nexusApi.recordFirstResponse(id);
      setActionSuccessMsg(`First response recorded on handoff ${id.slice(0, 8)}`);
      await fetchHandoffs();
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Failed to record first response');
    }
  };

  const handleTransition = async (id: string, toStatus: string) => {
    try {
      await nexusApi.transitionHandoff(id, toStatus);
      setActionSuccessMsg(`Handoff transitioned to ${toStatus}`);
      await fetchHandoffs();
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Failed to transition handoff');
    }
  };

  const handleEvaluateSla = async () => {
    setEvaluatingSla(true);
    setSlaResultMsg(null);
    try {
      const res = await nexusApi.evaluateSlaBreaches();
      setSlaResultMsg(`SLA evaluation complete: ${res.escalatedCount} overdue handoffs escalated.`);
      await fetchHandoffs();
      setTimeout(() => setSlaResultMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'SLA evaluation sweep failed');
    } finally {
      setEvaluatingSla(false);
    }
  };

  const statusBadge = (st: string) => {
    switch (st) {
      case 'completed':
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case 'in_progress':
        return 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'escalated':
      case 'failed':
        return 'border-destructive/30 bg-destructive/10 text-destructive';
      case 'assigned':
      case 'pending':
      default:
        return 'border-border bg-muted text-muted-foreground';
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
              Handoffs & SLA Manager
              <span className="px-2 py-0.5 text-[11px] font-medium rounded-control border border-border bg-muted">
                {handoffs.length} Active Handoffs
              </span>
            </h1>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Manage rep routing, SLA response times, and state transitions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleEvaluateSla}
            disabled={evaluatingSla}
            className="flex items-center gap-1.5 h-8 px-3 rounded-control border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-medium transition-colors disabled:opacity-50 shrink-0"
          >
            <ShieldAlert className={`size-3.5 ${evaluatingSla ? 'animate-spin' : ''}`} />
            <span>{evaluatingSla ? 'Evaluating...' : <>Evaluate SLA<span className="hidden sm:inline"> Breaches</span></>}</span>
          </button>
          <button
            type="button"
            onClick={() => fetchHandoffs()}
            disabled={isLoading}
            className="flex items-center gap-1.5 h-8 px-3 rounded-control border border-border bg-background hover:bg-muted text-xs font-medium transition-colors disabled:opacity-50 shrink-0"
          >
            <RotateCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-4">
        {/* Banner Feedback Messages */}
        {actionSuccessMsg && (
          <div className="rounded-control border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle className="size-4" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {slaResultMsg && (
          <div className="rounded-control border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
            <Check className="size-4" />
            <span>{slaResultMsg}</span>
          </div>
        )}

        {error && (
          <div className="rounded-control border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button type="button" onClick={() => fetchHandoffs()} className="underline font-medium">
              Retry
            </button>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-control border border-border bg-card p-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {['all', 'assigned', 'in_progress', 'completed', 'escalated', 'failed'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`h-7 px-2.5 rounded-control font-medium capitalize text-xs transition-colors ${
                  statusFilter === st
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-background hover:bg-muted text-muted-foreground'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-8 rounded-control border border-input bg-background px-2 text-xs outline-none focus:border-ring"
            >
              <option value="all">All Roles</option>
              <option value="account_executive">Account Executive</option>
              <option value="inbound_sdr">Inbound SDR</option>
              <option value="customer_success">Customer Success</option>
            </select>
          </div>
        </div>

        {/* Handoffs Table */}
        <div className="rounded-control border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
              <RotateCw className="size-5 animate-spin mx-auto text-primary" />
              <p>Loading handoffs from database...</p>
            </div>
          ) : handoffs.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground space-y-3">
              <Layers className="size-8 mx-auto text-muted-foreground/60" />
              <p className="font-semibold text-foreground text-sm">No handoffs match the selected criteria</p>
              <p className="max-w-md mx-auto text-muted-foreground">
                Handoffs are generated automatically when high-intent activation or expansion signals are detected from product usage events.
              </p>
              <div className="pt-2">
                <Link
                  to="/inspector"
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-control bg-primary text-primary-foreground text-xs font-medium"
                >
                  Ingest Test Event
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-[11px] font-medium text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5">Domain / Account</th>
                    <th className="px-4 py-2.5">Target Role</th>
                    <th className="px-4 py-2.5">Assigned Owner</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">SLA Deadline</th>
                    <th className="px-4 py-2.5">First Response</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {handoffs.map((h) => {
                    const isOverdue = new Date(h.sla_deadline).getTime() < Date.now() && h.status !== 'completed';
                    return (
                      <tr key={h.id} className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">
                          <Link
                            to={`/accounts-360/${encodeURIComponent(h.domain || h.account_id)}`}
                            className="hover:underline flex items-center gap-1"
                          >
                            {h.domain || h.account_id}
                            <ArrowUpRight className="size-3 text-muted-foreground" />
                          </Link>
                        </td>
                        <td className="px-4 py-3 capitalize text-muted-foreground">
                          {h.target_role.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-foreground">
                          {h.assigned_owner_id}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-control border ${statusBadge(h.status)} capitalize`}>
                            {h.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`flex items-center gap-1 font-mono text-[11px] ${isOverdue ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                            <Clock className="size-3" />
                            {new Date(h.sla_deadline).toLocaleTimeString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-[11px]">
                          {h.first_responded_at ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              {new Date(h.first_responded_at).toLocaleTimeString()}
                            </span>
                          ) : (
                            <span className="italic text-muted-foreground">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!h.first_responded_at && (
                              <button
                                type="button"
                                onClick={() => handleRecordFirstResponse(h.id)}
                                className="h-6 px-2 text-[10px] font-medium rounded-control border border-border bg-background hover:bg-muted text-primary"
                                title="Record rep first response timestamp"
                              >
                                Record First Response
                              </button>
                            )}

                            {h.status === 'pending' && (
                              <button
                                type="button"
                                onClick={() => handleTransition(h.id, 'assigned')}
                                className="h-6 px-2 text-[10px] font-medium rounded-control bg-primary text-primary-foreground hover:bg-primary/90"
                              >
                                Assign Rep
                              </button>
                            )}

                            {h.status === 'assigned' && (
                              <button
                                type="button"
                                onClick={() => handleTransition(h.id, 'in_progress')}
                                className="h-6 px-2 text-[10px] font-medium rounded-control bg-primary text-primary-foreground hover:bg-primary/90"
                              >
                                Start Progress
                              </button>
                            )}

                            {(h.status === 'in_progress' || h.status === 'escalated') && (
                              <button
                                type="button"
                                onClick={() => handleTransition(h.id, 'completed')}
                                className="h-6 px-2 text-[10px] font-medium rounded-control bg-primary text-primary-foreground hover:bg-primary/90"
                              >
                                {h.status === 'escalated' ? 'Resolve & Complete' : 'Complete'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
