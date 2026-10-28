import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { nexusApi, OperationalMetrics, SystemMeta, ReconcileResult } from '../services/nexusApi';

interface NexusContextType {
  metrics: OperationalMetrics | null;
  meta: SystemMeta | null;
  isBackendOnline: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshMetrics: () => Promise<void>;
  triggerReconcile: () => Promise<ReconcileResult>;
}

const NexusContext = createContext<NexusContextType | undefined>(undefined);

export const NexusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [metrics, setMetrics] = useState<OperationalMetrics | null>(null);
  const [meta, setMeta] = useState<SystemMeta | null>(null);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refreshMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [m, metaData] = await Promise.allSettled([
        nexusApi.getMetrics(),
        nexusApi.getMeta(),
      ]);

      if (m.status === 'fulfilled') {
        setMetrics(m.value);
        setIsBackendOnline(true);
        setLastUpdated(new Date());
      } else {
        throw m.reason;
      }

      if (metaData.status === 'fulfilled') {
        setMeta(metaData.value);
      }
    } catch (err: any) {
      console.warn('NEXUS Backend connection notice:', err.message || err);
      setIsBackendOnline(false);
      setError(err.message || 'Unable to connect to NEXUS backend control plane');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const triggerReconcile = useCallback(async (): Promise<ReconcileResult> => {
    const res = await nexusApi.reconcile();
    await refreshMetrics();
    return res;
  }, [refreshMetrics]);

  useEffect(() => {
    refreshMetrics();
    // Refresh operational metrics every 30s
    const interval = setInterval(refreshMetrics, 30000);
    return () => clearInterval(interval);
  }, [refreshMetrics]);

  return (
    <NexusContext.Provider
      value={{
        metrics,
        meta,
        isBackendOnline,
        isLoading,
        error,
        lastUpdated,
        refreshMetrics,
        triggerReconcile,
      }}
    >
      {children}
    </NexusContext.Provider>
  );
};

export function useNexus(): NexusContextType {
  const ctx = useContext(NexusContext);
  if (!ctx) {
    throw new Error('useNexus must be used within a NexusProvider');
  }
  return ctx;
}
