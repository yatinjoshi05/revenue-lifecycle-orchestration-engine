import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { InboundIntentLog, RloeTelemetry, SystemErrorLog, RloeMetrics } from '../types/rloe';
import { RloeSettings, ConnectionTestResult } from '../types/settings';
import { loadSettings, saveSettings, resetSettings as resetStoredSettings } from '../services/settings';
import {
  fetchInboundIntentLogs,
  fetchRloeTelemetry,
  fetchSystemErrorLogs,
  testSupabaseConnection,
  testN8nConnection,
  testNvidiaConnection,
  dispatchInboundSignal,
  signInOperator,
  signOutOperator,
  getStoredSession,
  OperatorSession,
} from '../services/rloe';

interface RloeContextType {
  settings: RloeSettings;
  updateSettings: (newSettings: RloeSettings) => void;
  resetSettings: () => void;
  testResults: Record<'supabase' | 'n8n' | 'nvidia', ConnectionTestResult>;
  runConnectionTest: (service: 'supabase' | 'n8n' | 'nvidia') => Promise<ConnectionTestResult>;
  inboundLogs: InboundIntentLog[];
  telemetry: RloeTelemetry[];
  errorLogs: SystemErrorLog[];
  metrics: RloeMetrics;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  simulateSignal: (companyDomain: string, source: string) => Promise<{ success: boolean; message: string }>;
  clearTelemetryData: () => void;
  // Operator Authentication (Zero Hardcoded Secrets)
  session: OperatorSession | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isTelemetryRestrictedByRls: boolean;
}

const RloeContext = createContext<RloeContextType | undefined>(undefined);

export const RloeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<RloeSettings>(loadSettings);
  const [session, setSession] = useState<OperatorSession | null>(getStoredSession);
  const [inboundLogs, setInboundLogs] = useState<InboundIntentLog[]>([]);
  const [telemetry, setTelemetry] = useState<RloeTelemetry[]>([]);
  const [errorLogs, setErrorLogs] = useState<SystemErrorLog[]>([]);
  const [isTelemetryRestrictedByRls, setIsTelemetryRestrictedByRls] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [testResults, setTestResults] = useState<Record<'supabase' | 'n8n' | 'nvidia', ConnectionTestResult>>({
    supabase: { service: 'supabase', status: 'idle', message: 'Not tested' },
    n8n: { service: 'n8n', status: 'idle', message: 'Not tested' },
    nvidia: { service: 'nvidia', status: 'idle', message: 'Not tested' },
  });

  const isConnected = Boolean(settings.supabaseUrl && settings.supabaseAnonKey);

  // Fetch real data when credentials or session changes
  const refreshData = useCallback(async () => {
    if (!settings.supabaseUrl || !settings.supabaseAnonKey) {
      setInboundLogs([]);
      setTelemetry([]);
      setErrorLogs([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const logs = await fetchInboundIntentLogs(settings);
      const [telemResult, errs] = await Promise.all([
        fetchRloeTelemetry(settings),
        fetchSystemErrorLogs(settings),
      ]);
      setInboundLogs(logs);
      setTelemetry(telemResult.rows);
      setIsTelemetryRestrictedByRls(telemResult.isRestrictedByRls);
      setErrorLogs(errs);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch RLOE data from Supabase');
    } finally {
      setIsLoading(false);
    }
  }, [settings]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Handle auto-refresh interval if configured
  useEffect(() => {
    if (settings.autoRefreshInterval > 0 && isConnected) {
      const intervalId = setInterval(() => {
        refreshData();
      }, settings.autoRefreshInterval * 1000);
      return () => clearInterval(intervalId);
    }
  }, [settings.autoRefreshInterval, isConnected, refreshData]);

  const updateSettings = (newSettings: RloeSettings) => {
    saveSettings(newSettings);
    setSettings(newSettings);
  };

  const resetSettings = () => {
    resetStoredSettings();
    setSettings(loadSettings());
    setInboundLogs([]);
    setTelemetry([]);
    setErrorLogs([]);
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const result = await signInOperator(email, password, settings);
    setIsLoading(false);
    if (result.success && result.session) {
      setSession(result.session);
      await refreshData();
      return { success: true };
    }
    return { success: false, error: result.error || 'Authentication failed' };
  };

  const logout = () => {
    signOutOperator();
    setSession(null);
    refreshData();
  };

  const runConnectionTest = async (service: 'supabase' | 'n8n' | 'nvidia'): Promise<ConnectionTestResult> => {
    setTestResults((prev) => ({
      ...prev,
      [service]: { service, status: 'testing', message: 'Testing connection...' },
    }));

    let result: ConnectionTestResult;
    if (service === 'supabase') {
      result = await testSupabaseConnection(settings);
    } else if (service === 'n8n') {
      result = await testN8nConnection(settings);
    } else {
      result = await testNvidiaConnection(settings);
    }

    setTestResults((prev) => ({ ...prev, [service]: result }));
    return result;
  };

  const simulateSignal = async (companyDomain: string, source: string) => {
    const res = await dispatchInboundSignal(settings, { company_domain: companyDomain, source });
    
    // Add real event entry to logs so operator sees immediate recorded inbound
    const newLog: InboundIntentLog = {
      id: `signal_${Date.now()}`,
      company_domain: companyDomain,
      source,
      received_at: new Date().toISOString(),
      cache_hit: false,
    };
    setInboundLogs((prev) => [newLog, ...prev]);

    return res;
  };

  const clearTelemetryData = () => {
    setInboundLogs([]);
    setTelemetry([]);
    setErrorLogs([]);
  };

  // Dynamically compute the required RLOE metrics strictly from real data
  const metrics: RloeMetrics = useMemo(() => {
    const totalSignalsIngested = inboundLogs.length;

    // Cache Triage Resolution Rate: cache hits / total eligible inputs * 100
    // Handle zero denominator gracefully
    const eligibleInputs = inboundLogs.filter((l) => typeof l.cache_hit === 'boolean');
    const cacheHitsCount = eligibleInputs.filter((l) => l.cache_hit === true).length;
    const cacheTriageResolutionRate =
      eligibleInputs.length > 0 ? Math.round((cacheHitsCount / eligibleInputs.length) * 100) : 0;

    // Sales priority counts from verified inbound signals
    const salesPriorityRecords = inboundLogs.filter((l) => l.route === 'sales_priority');
    const salesPriorityCount = salesPriorityRecords.length;
    const needsReviewCount = inboundLogs.filter((l) => l.route === 'needs_review').length;
    const disqualifiedCount = inboundLogs.filter((l) => l.route === 'disqualified').length;

    // Estimated Pipeline Value: sum of verified annual revenue where present, otherwise $0
    // Strictly zero synthetic $85k multiplier
    const confirmedRevenue = salesPriorityRecords.reduce(
      (sum, l) => sum + (Number(l.estimated_annual_revenue) || 0),
      0
    );

    // Cumulative token spend from real telemetry records
    const llmTokenSpendUSD = telemetry.reduce((sum, t) => sum + (t.est_cost_usd || 0), 0);

    // Average latency calculated only from real measurements
    const validLatencies = telemetry.filter((t) => typeof t.total_ms === 'number' && t.total_ms > 0);
    const averageLatencyMs =
      validLatencies.length > 0
        ? Math.round(validLatencies.reduce((sum, t) => sum + (t.total_ms || 0), 0) / validLatencies.length)
        : null;

    return {
      totalSignalsIngested,
      cacheTriageResolutionRate,
      estimatedPipelineVelocity: confirmedRevenue,
      salesPriorityCount,
      needsReviewCount,
      disqualifiedCount,
      llmTokenSpendUSD,
      averageLatencyMs,
      isConnected,
      lastUpdated: new Date().toISOString(),
    };
  }, [inboundLogs, telemetry, isConnected]);

  return (
    <RloeContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        testResults,
        runConnectionTest,
        inboundLogs,
        telemetry,
        errorLogs,
        metrics,
        isLoading,
        error,
        refreshData,
        simulateSignal,
        clearTelemetryData,
        session,
        login,
        logout,
        isTelemetryRestrictedByRls,
      }}
    >
      {children}
    </RloeContext.Provider>
  );
};

export const useRloe = (): RloeContextType => {
  const context = useContext(RloeContext);
  if (!context) {
    throw new Error('useRloe must be used within an RloeProvider');
  }
  return context;
};
