import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { nexusApi, IntegrityIssue } from '../services/nexusApi';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  ArrowUpRight,
  UserCheck,
  Check,
  X,
  Play,
  Layers,
  FileText,
} from 'lucide-react';

interface RevenueIntegrityPageProps {
  onToggleMobileSidebar: () => void;
}

export const RevenueIntegrityPage: React.FC<RevenueIntegrityPageProps> = ({
  onToggleMobileSidebar,
}) => {
  const [issues, setIssues] = useState<IntegrityIssue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Approval Modal State
  const [activeApprovalIssue, setActiveApprovalIssue] = useState<IntegrityIssue | null>(null);
  const [approverEmail, setApproverEmail] = useState('operator@nexus-gtm.internal');
  const [isApproving, setIsApproving] = useState(false);

  // Execution State (after approval returns decision token)
  const [executionToken, setExecutionToken] = useState<string | null>(null);
  const [approvedActionId, setApprovedActionId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const fetchIssues = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await nexusApi.getIssues({
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setIssues(data);
    } catch (err: any) {
      console.warn('Failed to fetch integrity issues:', err.message);
      setError(err.message || 'Error fetching integrity issues from backend');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeApprovalIssue) return;
    const actionId =
      activeApprovalIssue.proposed_action_id ||
      (activeApprovalIssue.evidence as any)?.action_id ||
      activeApprovalIssue.id;

    setIsApproving(true);
    setError(null);
    try {
      const res = await nexusApi.approveAction(actionId, approverEmail.trim());
      setApprovedActionId(res.action.id);
      setExecutionToken(res.decisionToken);
      setActionSuccessMsg(`Action approved by ${approverEmail}. Cryptographic decision token issued.`);
      setActiveApprovalIssue(null);
      await fetchIssues();
    } catch (err: any) {
      setError(err.message || 'Failed to approve action');
    } finally {
      setIsApproving(false);
    }
  };

  const handleExecute = async (actionId: string, token: string) => {
    setIsExecuting(true);
    setError(null);
    try {
      const res = await nexusApi.executeAction(actionId, token);
      setActionSuccessMsg('Action repair executed and postcondition verified in PostgreSQL.');
      setExecutionToken(null);
      setApprovedActionId(null);
      await fetchIssues();
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to execute repair action');
    } finally {
      setIsExecuting(false);
    }
  };

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
            <ShieldAlert className="size-4" />
          </button>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              Revenue Integrity & Approvals
              <span className="px-2 py-0.5 text-[11px] font-medium rounded-control border border-border bg-muted">
                {issues.length} Issues
              </span>
            </h1>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Human-in-the-loop governance for pipeline anomalies, orphan opportunities, and automated repairs
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchIssues()}
          disabled={isLoading}
          className="flex items-center gap-1.5 h-8 px-3 rounded-control border border-border bg-background hover:bg-muted text-xs font-medium transition-colors disabled:opacity-50"
        >
          <RotateCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-4">
        {/* Banner Feedback Messages */}
        {actionSuccessMsg && (
          <div className="rounded-control border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {error && (
          <div className="rounded-control border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button type="button" onClick={() => fetchIssues()} className="underline font-medium">
              Retry
            </button>
          </div>
        )}

        {/* Action Pending Execution Card */}
        {executionToken && approvedActionId && (
          <div className="rounded-control border border-primary/40 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <UserCheck className="size-4 text-emerald-500" />
                  Repair Action Approved: Ready for Atomic Execution
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Action ID: <span className="font-mono">{approvedActionId}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleExecute(approvedActionId, executionToken)}
                disabled={isExecuting}
                className="h-8 px-4 rounded-control bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 flex items-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                <Play className={`size-3.5 ${isExecuting ? 'animate-spin' : ''}`} />
                <span>{isExecuting ? 'Executing Repair...' : 'Execute Repair Now'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-control border border-border bg-card p-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {['all', 'detected', 'in_review', 'resolved', 'rejected'].map((st) => (
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
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <span className="text-xs text-muted-foreground">
            Rules 001 - 005 Active
          </span>
        </div>

        {/* Issues Table */}
        <div className="rounded-control border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
              <RotateCw className="size-5 animate-spin mx-auto text-primary" />
              <p>Loading revenue integrity findings from database...</p>
            </div>
          ) : issues.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground space-y-3">
              <CheckCircle2 className="size-8 mx-auto text-emerald-500" />
              <p className="font-semibold text-foreground text-sm">Zero revenue integrity issues detected</p>
              <p className="max-w-md mx-auto text-muted-foreground">
                All opportunities, accounts, and contact lifecycle states comply with integrity rules. No unowned deals or anomalous billing states exist.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-[11px] font-medium text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5">Rule ID</th>
                    <th className="px-4 py-2.5">Entity Type & ID</th>
                    <th className="px-4 py-2.5">Severity</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Detected At</th>
                    <th className="px-4 py-2.5 text-right">Human Approval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {issues.map((iss) => (
                    <tr key={iss.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-foreground text-[11px]">
                        {iss.rule_id}
                      </td>
                      <td className="px-4 py-3 text-foreground font-medium">
                        <span className="capitalize">{iss.entity_type}</span>: <span className="font-mono text-[11px] text-muted-foreground">{iss.entity_id.slice(0, 8)}...</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-control border ${severityBadge(iss.severity)} capitalize`}>
                          {iss.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">
                        {iss.status.replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-[11px]">
                        {new Date(iss.detected_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {iss.proposed_action_id && (iss.status === 'action_proposed' || iss.status === 'detected' || iss.status === 'in_review') ? (
                          <button
                            type="button"
                            onClick={() => setActiveApprovalIssue(iss)}
                            className="h-6 px-2.5 text-[10px] font-medium rounded-control bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            Review & Authorize
                          </button>
                        ) : iss.status === 'approved' ? (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            Approved (Pending Execution)
                          </span>
                        ) : iss.status === 'resolved' ? (
                          <span className="text-[11px] text-muted-foreground italic">
                            Resolved
                          </span>
                        ) : !iss.proposed_action_id ? (
                          <span className="text-[11px] text-muted-foreground italic">
                            Telemetry Finding Only
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic capitalize">
                            {iss.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Human-in-the-Loop Approval Modal */}
      {activeApprovalIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-control border border-border bg-card p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Human Approval Gate: {activeApprovalIssue.rule_id}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Target Entity: {activeApprovalIssue.entity_type} ({activeApprovalIssue.entity_id})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveApprovalIssue(null)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleApprove} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground block">
                  Detected Evidence & Anomaly:
                </label>
                <pre className="p-3 rounded-control bg-muted/60 text-foreground font-mono text-[11px] overflow-x-auto max-h-40 border border-border">
                  {JSON.stringify(activeApprovalIssue.evidence || {}, null, 2)}
                </pre>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground block">
                  Authorizing Operator Email *
                </label>
                <input
                  type="email"
                  required
                  value={approverEmail}
                  onChange={(e) => setApproverEmail(e.target.value)}
                  placeholder="e.g. revops_lead@company.com"
                  className="h-8 w-full rounded-control border border-input bg-background px-3 text-xs outline-none focus:border-ring"
                />
                <p className="text-[10px] text-muted-foreground">
                  Cryptographic HMAC signature will be bound to this operator identity and payload hash.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setActiveApprovalIssue(null)}
                  className="h-8 px-3 rounded-control border border-border bg-background hover:bg-muted text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isApproving}
                  className="h-8 px-4 rounded-control bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {isApproving ? 'Issuing Decision Token...' : 'Authorize Proposed Repair'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
