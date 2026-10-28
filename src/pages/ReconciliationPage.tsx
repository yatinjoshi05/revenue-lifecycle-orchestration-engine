import React, { useState, useEffect } from 'react';
import { useNexus } from '../context/NexusContext';
import { nexusApi, FailedOperations, ReconcileResult } from '../services/nexusApi';
import { RefreshCw, AlertTriangle, ShieldCheck, Play, CheckCircle2, Clock } from 'lucide-react';

export const ReconciliationPage: React.FC = () => {
  const { isBackendOnline, triggerReconcile } = useNexus();
  const [failures, setFailures] = useState<FailedOperations | null>(null);
  const [isLoadingFailures, setIsLoadingFailures] = useState(true);
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconResult, setReconResult] = useState<ReconcileResult | null>(null);
  const [reconError, setReconError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchFailures = async () => {
    setIsLoadingFailures(true);
    try {
      const data = await nexusApi.getFailures();
      setFailures(data);
    } catch (err: any) {
      console.error('Failed to load failure logs:', err);
    } finally {
      setIsLoadingFailures(false);
    }
  };

  useEffect(() => {
    fetchFailures();
  }, []);

  const handleExecuteReconciliation = async () => {
    setShowConfirmModal(false);
    setIsReconciling(true);
    setReconResult(null);
    setReconError(null);
    try {
      const result = await triggerReconcile();
      setReconResult(result);
      fetchFailures();
    } catch (err: any) {
      setReconError(err.message || 'Reconciliation failed.');
    } finally {
      setIsReconciling(false);
    }
  };

  const totalFailures =
    (failures?.failedHandoffs?.length || 0) +
    (failures?.failedActionAttempts?.length || 0) +
    (failures?.criticalIssues?.length || 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Operations and Pipeline Reconciliation
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Trigger deterministic cluster reconciliation across event pipelines and inspect recorded failure logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchFailures}
            disabled={isLoadingFailures}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFailures ? 'animate-spin' : ''}`} />
            Refresh Logs
          </button>
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={!isBackendOnline || isReconciling}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded hover:bg-slate-800 dark:hover:bg-white transition disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isReconciling ? 'animate-pulse' : ''}`} />
            {isReconciling ? 'Reconciling...' : 'Trigger Cluster Reconciliation'}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Confirm Cluster Reconciliation</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Triggering reconciliation locks the operational mutex across the NEXUS event pipeline. It re-evaluates pending handoffs, synchronizes queue states, and resolves transient pipeline discrepancies against the live database.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteReconciliation}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 rounded"
              >
                Execute Reconciliation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reconciliation Output Banner */}
      {reconResult && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">Reconciliation Executed Successfully</h4>
            <pre className="text-xs font-mono text-emerald-800 dark:text-emerald-300 overflow-x-auto max-h-32">
              {JSON.stringify(reconResult, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {reconError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-semibold text-rose-900 dark:text-rose-200">Reconciliation Failed</h4>
            <p className="text-xs text-rose-800 dark:text-rose-300 mt-0.5">{reconError}</p>
          </div>
        </div>
      )}

      {/* Safety Notice */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Operational safety rule: All reconciliation passes use transactional idempotency keys. Failed operations below reflect verified exceptions logged during event ingestion, enrichment calls, or SLA routing.
        </p>
      </div>

      {/* Failed Operations Log Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Pipeline Failure Logs ({totalFailures})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live operational errors with correlation identifiers and failure reasons.
            </p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400">
            endpoint: /api/v1/operations/failures
          </span>
        </div>

        {isLoadingFailures ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading operational failures...</div>
        ) : totalFailures === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">No Failed Operations</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              No unhandled errors or pipeline failures are recorded in the active operational window.
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {failures?.failedHandoffs && failures.failedHandoffs.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Failed Handoffs ({failures.failedHandoffs.length})
                </h3>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                      <tr>
                        <th className="p-2">ID</th>
                        <th className="p-2">Role</th>
                        <th className="p-2">Owner</th>
                        <th className="p-2">Error Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {failures.failedHandoffs.map((h) => (
                        <tr key={h.id}>
                          <td className="p-2 font-mono text-xs">{h.id}</td>
                          <td className="p-2">{h.target_role}</td>
                          <td className="p-2 font-mono text-xs">{h.assigned_owner_id || 'unassigned'}</td>
                          <td className="p-2 text-rose-600 font-mono text-xs">{JSON.stringify(h.error_details || {})}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {failures?.failedActionAttempts && failures.failedActionAttempts.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Failed Action Attempts ({failures.failedActionAttempts.length})
                </h3>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                      <tr>
                        <th className="p-2">Action / Target</th>
                        <th className="p-2">Target ID</th>
                        <th className="p-2">Timestamp</th>
                        <th className="p-2">Error Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {failures.failedActionAttempts.map((a) => (
                        <tr key={a.id}>
                          <td className="p-2 font-medium">{a.action_type || 'repair_execution'}</td>
                          <td className="p-2 font-mono text-xs">{a.target_id || a.id}</td>
                          <td className="p-2 text-slate-500">{a.executed_at ? new Date(a.executed_at).toLocaleTimeString() : 'N/A'}</td>
                          <td className="p-2 text-rose-600 font-mono text-xs">{a.error_message || 'Verification failure'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
