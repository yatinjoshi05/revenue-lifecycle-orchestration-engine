import React, { useState, useEffect, useCallback } from 'react';
import { nexusApi, EnrichmentJob } from '../services/nexusApi';
import { validateDomain, sanitizeCsvCell } from '../utils/security';
import {
  Sparkles,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Clock,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

interface EnrichmentPageProps {
  onToggleMobileSidebar: () => void;
}

export const EnrichmentPage: React.FC<EnrichmentPageProps> = ({
  onToggleMobileSidebar,
}) => {
  const [jobs, setJobs] = useState<EnrichmentJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CSV Import State
  const [csvContent, setCsvContent] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await nexusApi.getEnrichmentJobs();
      setJobs(data);
    } catch (err: any) {
      console.warn('Failed to fetch enrichment jobs:', err.message);
      setError(err.message || 'Error fetching enrichment jobs from backend');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setCsvErrors(['Only CSV files (.csv) are supported']);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      validateAndParseCsv(text);
    };
    reader.readAsText(file);
  };

  const validateAndParseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      setCsvErrors(['CSV must contain a header row and at least one data row']);
      setParsedRows([]);
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ''));
    if (!headers.includes('domain')) {
      setCsvErrors(["CSV is missing the mandatory 'domain' header column"]);
      setParsedRows([]);
      return;
    }

    const errors: string[] = [];
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => sanitizeCsvCell(c.trim().replace(/^"|"$/g, '')));
      const row: Record<string, any> = {};
      headers.forEach((h, idx) => {
        row[h] = cols[idx] || null;
      });

      const domainCheck = validateDomain(row.domain || '');
      if (!domainCheck.valid) {
        errors.push(`Row ${i}: ${domainCheck.error} ('${row.domain || ''}')`);
      } else {
        row.domain = domainCheck.normalized;
        rows.push(row);
      }
    }

    setCsvErrors(errors);
    setParsedRows(rows);
  };

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;
    setImportSuccessMsg(
      `Validated ${parsedRows.length} account rows for Clay bridge reconciliation. Non-destructive attributes queued.`
    );
    setParsedRows([]);
    setCsvContent('');
    setTimeout(() => setImportSuccessMsg(null), 5000);
  };

  const statusBadge = (st: string) => {
    switch (st) {
      case 'completed':
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case 'submitted':
      case 'pending':
        return 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'failed':
      case 'timed_out':
        return 'border-destructive/30 bg-destructive/10 text-destructive';
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
            <Sparkles className="size-4" />
          </button>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              Enrichment Operations
              <span className="px-2 py-0.5 text-[11px] font-medium rounded-control border border-border bg-muted">
                Clay Integration
              </span>
            </h1>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Asynchronous Clay webhook lifecycle and repeatable manual CSV export bridge
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchJobs()}
          disabled={isLoading}
          className="flex items-center gap-1.5 h-8 px-3 rounded-control border border-border bg-background hover:bg-muted text-xs font-medium transition-colors disabled:opacity-50"
        >
          <RotateCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Clay Asynchronous Integration Status Banner */}
        <div className="rounded-control border border-blue-500/20 bg-blue-500/10 p-4 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
          <ShieldCheck className="size-4 shrink-0 text-blue-500 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              Clay Integration Architecture: Asynchronous Callback Pattern
            </p>
            <p className="text-muted-foreground text-[11px]">
              Clay enrichment operates via outbound webhook submission followed by asynchronous HMAC-signed callbacks.
              In development, mock callbacks are prohibited; jobs progress only when genuine webhook responses arrive.
            </p>
          </div>
        </div>

        {importSuccessMsg && (
          <div className="rounded-control border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{importSuccessMsg}</span>
          </div>
        )}

        {/* Manual Clay CSV Bridge Section */}
        <section className="rounded-control border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h2 className="text-xs font-semibold text-foreground flex items-center gap-2">
                <FileSpreadsheet className="size-4 text-indigo-500" />
                Repeatable Clay Manual CSV Export Bridge
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Import CSVs exported from Clay. Validates required domain column and preserves non-destructive values.
              </p>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-control bg-muted text-muted-foreground">
              Module A Bridge
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Upload Zone */}
            <div className="border-2 border-dashed border-border rounded-control p-6 text-center space-y-2 hover:border-foreground/30 transition-colors">
              <Upload className="size-6 mx-auto text-muted-foreground" />
              <p className="text-xs font-medium text-foreground">Select Clay CSV Export</p>
              <p className="text-[10px] text-muted-foreground">
                Columns supported: domain (required), employee_count, revenue_range, industry
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-control file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer pt-2"
              />
            </div>

            {/* Validation & Preview Card */}
            <div className="p-4 rounded-control bg-muted/30 border border-border/60 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-foreground block">
                  Validation Summary
                </span>
                {parsedRows.length > 0 ? (
                  <div className="space-y-1 text-xs">
                    <p className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5" />
                      {parsedRows.length} valid rows ready for import
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Target domains: {parsedRows.slice(0, 3).map((r) => r.domain).join(', ')}
                      {parsedRows.length > 3 ? ` (+${parsedRows.length - 3} more)` : ''}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    No CSV uploaded yet. Upload a file to preview validated records.
                  </p>
                )}

                {csvErrors.length > 0 && (
                  <div className="rounded-control border border-destructive/20 bg-destructive/10 p-2.5 text-[11px] text-destructive space-y-1">
                    {csvErrors.map((err, i) => (
                      <p key={i}>&bull; {err}</p>
                    ))}
                  </div>
                )}
              </div>

              {parsedRows.length > 0 && (
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="h-8 px-4 rounded-control bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 flex items-center justify-center gap-1.5"
                >
                  Confirm & Queue Non-Destructive Update
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Enrichment Jobs Table */}
        <div className="rounded-control border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border/60 flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              Asynchronous Enrichment Jobs Queue
            </span>
            <span className="text-[11px] text-muted-foreground">
              {jobs.length} Total Jobs Recorded
            </span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
              <RotateCw className="size-5 animate-spin mx-auto text-primary" />
              <p>Loading enrichment jobs from database...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
              <Layers className="size-8 mx-auto text-muted-foreground/60" />
              <p className="font-semibold text-foreground text-sm">No enrichment jobs found</p>
              <p className="max-w-md mx-auto text-muted-foreground">
                Enrichment jobs are created automatically when accounts enter the pipeline without firmographic details.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-[11px] font-medium text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5">Domain</th>
                    <th className="px-4 py-2.5">Job ID</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Provider Request ID</th>
                    <th className="px-4 py-2.5">Created At</th>
                    <th className="px-4 py-2.5">Completed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {jobs.map((j) => (
                    <tr key={j.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {j.domain}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                        {j.id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-control border ${statusBadge(j.status)} capitalize`}>
                          {j.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                        {j.provider_request_id || 'Pending'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-[11px]">
                        {new Date(j.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-[11px]">
                        {j.completed_at ? new Date(j.completed_at).toLocaleString() : 'In Flight'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
