import React, { useState, useEffect } from 'react';
import { useRloe } from '../context/RloeContext';
import { RloeSettings } from '../types/settings';
import {
  X,
  Shield,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  Loader2,
  Lock,
  Radio,
  Cpu,
  Settings,
  LogIn,
  LogOut,
  UserCheck,
} from 'lucide-react';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ open, onClose }) => {
  const {
    settings,
    updateSettings,
    resetSettings,
    testResults,
    runConnectionTest,
    session,
    login,
    logout,
  } = useRloe();

  const [formData, setFormData] = useState<RloeSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Operator Auth state (never stored in code or bundles)
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);

  // Sync state whenever drawer opens
  useEffect(() => {
    if (open) {
      setFormData(settings);
      setValidationError(null);
      setSaveSuccess(false);
      setAuthError(null);
    }
  }, [open, settings]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate Supabase URL format if entered
    if (formData.supabaseUrl && !formData.supabaseUrl.startsWith('http')) {
      setValidationError('Supabase URL must begin with https:// or http://');
      return;
    }

    // Validate n8n Webhook URL format if entered
    if (formData.n8nWebhookUrl && !formData.n8nWebhookUrl.startsWith('http')) {
      setValidationError('n8n Webhook URL must begin with https:// or http://');
      return;
    }

    setIsSaving(true);
    try {
      updateSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setValidationError(err.message || 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOperatorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!authEmail.trim() || !authPassword) {
      setAuthError('Please enter both team email and password');
      return;
    }

    setIsLoggingIn(true);
    const result = await login(authEmail, authPassword);
    setIsLoggingIn(false);

    if (result.success) {
      setAuthSuccess(true);
      setAuthPassword('');
      setTimeout(() => setAuthSuccess(false), 3000);
    } else {
      setAuthError(result.error || 'Authentication failed');
    }
  };

  const handleReset = () => {
    if (confirm('Reset all RLOE settings and disconnect endpoints?')) {
      resetSettings();
      setFormData({
        supabaseUrl: '',
        supabaseAnonKey: '',
        n8nWebhookUrl: '',
        nvidiaModel: 'nvidia/nemotron-3.5-lightning-30b-a3b',
        nvidiaEndpoint: '',
        autoRefreshInterval: 0,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="settings-heading">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <aside className="relative flex w-full max-w-lg flex-col bg-card border-l border-border h-full shadow-2xl z-10 overflow-hidden text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-control bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
              <Settings className="size-4.5" />
            </div>
            <div>
              <h2 id="settings-heading" className="text-sm font-semibold tracking-tight text-foreground">
                GTM System & RLOE Settings
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Configure orchestration endpoints and client-safe credentials
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-7 rounded-control flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close settings drawer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {validationError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Check className="size-4 shrink-0 text-emerald-600" />
              <span>Settings saved successfully.</span>
            </div>
          )}

          {/* Security Architecture Notice */}
          <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <Shield className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span>Zero-Trust Security Guarantee</span>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              No private server keys or operator passwords are baked into frontend bundles. Authenticated sessions are stored safely in session memory only, respecting Row-Level Security (RLS).
            </p>
          </div>

          {/* Section: Operator Authentication (RLS Authorization) */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-border">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <UserCheck className="size-3.5 text-blue-500" />
                Team Operator Authentication
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-medium text-muted-foreground">
                Supabase Auth RLS
              </span>
            </div>

            {session ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Active Session</span>
                    <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded font-mono">authenticated</span>
                  </div>
                  <p className="text-[11px] text-emerald-200">
                    Signed in as: <strong className="font-mono">{session.email}</strong>
                  </p>
                  <p className="text-[10px] text-emerald-400">
                    Granted least-privilege read access to canonical team tables under PostgreSQL RLS.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 h-7 px-3 rounded-control border border-border bg-background hover:bg-muted text-[11px] font-medium transition-colors text-foreground"
                >
                  <LogOut className="size-3" />
                  <span>Sign Out Operator</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleOperatorLogin} className="space-y-3">
                <p className="text-[11px] text-muted-foreground">
                  Sign in with your team credentials to authorize live access to intent logs and telemetry protected by RLS.
                </p>

                {authError && (
                  <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[11px] flex items-center gap-2">
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {authSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center gap-2">
                    <Check className="size-3.5 shrink-0 text-emerald-400" />
                    <span>Authentication successful. Session established.</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">Operator Email</label>
                  <input
                    type="email"
                    placeholder="operator@company.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="h-8 w-full rounded-control border border-input bg-background px-3 text-xs outline-none focus:border-ring"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">Operator Password</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="h-8 w-full rounded-control border border-input bg-background px-3 text-xs outline-none focus:border-ring"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn || !formData.supabaseUrl}
                  className="inline-flex items-center gap-1.5 h-7.5 px-3 rounded-control bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="size-3 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="size-3" />
                      <span>Sign In with Supabase Auth</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Section: Supabase Storage */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-border">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <DatabaseIcon className="size-3.5 text-blue-500" />
                  Supabase Canonical Tables
                </span>
                <button
                  type="button"
                  onClick={() => runConnectionTest('supabase')}
                  disabled={testResults.supabase.status === 'testing' || !formData.supabaseUrl}
                  className="h-6 px-2 rounded-control border border-border bg-background text-[11px] hover:bg-muted font-medium transition-colors disabled:opacity-50"
                >
                  {testResults.supabase.status === 'testing' ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="size-3 animate-spin" />
                      Testing
                    </span>
                  ) : (
                    'Test Connection'
                  )}
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground block">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={formData.supabaseUrl}
                  onChange={(e) => setFormData({ ...formData, supabaseUrl: e.target.value })}
                  className="h-8.5 w-full rounded-control border border-input bg-background px-3 text-xs outline-none focus:border-ring placeholder:text-muted-foreground/60"
                />
                <span className="text-[10px] text-muted-foreground">
                  Reads canonical tables: <code className="font-mono">inbound_intent_log</code>, <code className="font-mono">rloe_telemetry</code>, <code className="font-mono">system_error_log</code>.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground block">
                  Supabase Publishable / Anon Key
                </label>
                <input
                  type="text"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={formData.supabaseAnonKey}
                  onChange={(e) => setFormData({ ...formData, supabaseAnonKey: e.target.value })}
                  className="h-8.5 w-full rounded-control border border-input bg-background px-3 font-mono text-xs outline-none focus:border-ring placeholder:text-muted-foreground/60"
                />
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Lock className="size-3 shrink-0" />
                  <span>Client-safe anon key only. Never provide service-role keys here.</span>
                </div>
              </div>

              {testResults.supabase.status !== 'idle' && (
                <div
                  className={`p-2.5 rounded-lg border text-[11px] flex items-center gap-2 ${
                    testResults.supabase.status === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : testResults.supabase.status === 'error'
                      ? 'bg-destructive/10 border-destructive/20 text-destructive'
                      : 'bg-muted border-border text-muted-foreground'
                  }`}
                >
                  {testResults.supabase.status === 'success' ? (
                    <Check className="size-3.5 shrink-0" />
                  ) : testResults.supabase.status === 'error' ? (
                    <AlertCircle className="size-3.5 shrink-0" />
                  ) : (
                    <Loader2 className="size-3.5 shrink-0 animate-spin" />
                  )}
                  <span>{testResults.supabase.message}</span>
                </div>
              )}
            </div>

            {/* Section: n8n Orchestration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-border">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Radio className="size-3.5 text-purple-500" />
                  n8n Webhook / API Inbound Gate
                </span>
                <button
                  type="button"
                  onClick={() => runConnectionTest('n8n')}
                  disabled={testResults.n8n.status === 'testing' || !formData.n8nWebhookUrl}
                  className="h-6 px-2 rounded-control border border-border bg-background text-[11px] hover:bg-muted font-medium transition-colors disabled:opacity-50"
                >
                  {testResults.n8n.status === 'testing' ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="size-3 animate-spin" />
                      Testing
                    </span>
                  ) : (
                    'Test Webhook'
                  )}
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground block">
                  n8n Webhook Inbound Gate URL
                </label>
                <input
                  type="url"
                  placeholder="https://n8n.yourdomain.com/webhook/rloe-inbound"
                  value={formData.n8nWebhookUrl}
                  onChange={(e) => setFormData({ ...formData, n8nWebhookUrl: e.target.value })}
                  className="h-8.5 w-full rounded-control border border-input bg-background px-3 text-xs outline-none focus:border-ring placeholder:text-muted-foreground/60"
                />
                <span className="text-[10px] text-muted-foreground">
                  Inbound signals trigger Lane A ingestion and Lane B cache checks.
                </span>
              </div>

              {testResults.n8n.status !== 'idle' && (
                <div
                  className={`p-2.5 rounded-lg border text-[11px] flex items-center gap-2 ${
                    testResults.n8n.status === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : testResults.n8n.status === 'error'
                      ? 'bg-destructive/10 border-destructive/20 text-destructive'
                      : 'bg-muted border-border text-muted-foreground'
                  }`}
                >
                  {testResults.n8n.status === 'success' ? (
                    <Check className="size-3.5 shrink-0" />
                  ) : testResults.n8n.status === 'error' ? (
                    <AlertCircle className="size-3.5 shrink-0" />
                  ) : (
                    <Loader2 className="size-3.5 shrink-0 animate-spin" />
                  )}
                  <span>{testResults.n8n.message}</span>
                </div>
              )}
            </div>

            {/* Section: NVIDIA & AI Copilot Configuration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-border">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Cpu className="size-3.5 text-emerald-500" />
                  NVIDIA Agent & AI Co-pilot
                </span>
                <button
                  type="button"
                  onClick={() => runConnectionTest('nvidia')}
                  disabled={testResults.nvidia.status === 'testing' || !formData.nvidiaEndpoint}
                  className="h-6 px-2 rounded-control border border-border bg-background text-[11px] hover:bg-muted font-medium transition-colors disabled:opacity-50"
                >
                  {testResults.nvidia.status === 'testing' ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="size-3 animate-spin" />
                      Testing
                    </span>
                  ) : (
                    'Test Proxy'
                  )}
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground block">
                  Model Identifier
                </label>
                <input
                  type="text"
                  placeholder="nvidia/nemotron-3.5-lightning-30b-a3b"
                  value={formData.nvidiaModel}
                  onChange={(e) => setFormData({ ...formData, nvidiaModel: e.target.value })}
                  className="h-8.5 w-full rounded-control border border-input bg-background px-3 text-xs outline-none focus:border-ring font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground block">
                  Agent Proxy Endpoint (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://proxy.internal.gtm.dev/api/v1/agent"
                  value={formData.nvidiaEndpoint}
                  onChange={(e) => setFormData({ ...formData, nvidiaEndpoint: e.target.value })}
                  className="h-8.5 w-full rounded-control border border-input bg-background px-3 text-xs outline-none focus:border-ring placeholder:text-muted-foreground/60"
                />
                <span className="text-[10px] text-muted-foreground">
                  Optional. If blank, AI Co-pilot routes queries through n8n / local GTM context engine.
                </span>
              </div>

              {testResults.nvidia.status !== 'idle' && (
                <div
                  className={`p-2.5 rounded-lg border text-[11px] flex items-center gap-2 ${
                    testResults.nvidia.status === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : testResults.nvidia.status === 'error'
                      ? 'bg-destructive/10 border-destructive/20 text-destructive'
                      : 'bg-muted border-border text-muted-foreground'
                  }`}
                >
                  {testResults.nvidia.status === 'success' ? (
                    <Check className="size-3.5 shrink-0" />
                  ) : testResults.nvidia.status === 'error' ? (
                    <AlertCircle className="size-3.5 shrink-0" />
                  ) : (
                    <Loader2 className="size-3.5 shrink-0 animate-spin" />
                  )}
                  <span>{testResults.nvidia.message}</span>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="border-t border-border pt-4 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs text-destructive hover:underline"
              >
                <RotateCcw className="size-3.5" />
                <span>Reset Settings</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-8 px-3 rounded-control border border-border bg-background hover:bg-muted text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 h-8 px-4 rounded-control bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </aside>
    </div>
  );
};

const DatabaseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
  </svg>
);

export default SettingsDrawer;
