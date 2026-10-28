import { InboundIntentLog, RloeTelemetry, SystemErrorLog } from '../types/rloe';
import { RloeSettings, ConnectionTestResult } from '../types/settings';

/**
 * Service to interact with the RLOE backend (Supabase canonical tables & n8n orchestration webhooks).
 * Strict Zero-Trust Architecture:
 * - Never embeds hardcoded passwords or operator credentials in source code or client bundles.
 * - Respects Row-Level Security (RLS) policies.
 * - Authenticates team members via standard Supabase Auth sessions stored in sessionStorage.
 * - Employs timeouts, honest error states, and zero synthetic/fabricated data.
 */

const DEFAULT_TIMEOUT_MS = 8000;
const SESSION_STORAGE_KEY = 'rloe_operator_session_v1';

export interface OperatorSession {
  email: string;
  accessToken: string;
  expiresAt: number;
}

/**
 * Retrieve active operator session from browser sessionStorage.
 * Session tokens are kept in session memory only, never baked into client bundles.
 */
export function getStoredSession(): OperatorSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session: OperatorSession = JSON.parse(raw);
    if (session.expiresAt && Date.now() > session.expiresAt) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Save active operator session to sessionStorage.
 */
export function setStoredSession(session: OperatorSession): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('Failed to save operator session in storage', err);
  }
}

/**
 * Clear operator session.
 */
export function signOutOperator(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear operator session', err);
  }
}

/**
 * Sign in an operator using standard Supabase Auth (Principle of Least Privilege).
 * Obtains an authenticated JWT with role 'authenticated' for the team member.
 */
export async function signInOperator(
  email: string,
  password: string,
  settings: RloeSettings
): Promise<{ success: boolean; error?: string; session?: OperatorSession }> {
  if (!settings.supabaseUrl || !settings.supabaseAnonKey) {
    return { success: false, error: 'Supabase URL or Publishable Key is not configured' };
  }

  try {
    const authEndpoint = `${settings.supabaseUrl}/auth/v1/token?grant_type=password`;
    const res = await fetchWithTimeout(
      authEndpoint,
      {
        method: 'POST',
        headers: {
          apikey: settings.supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), password }),
      },
      8000
    );

    const data = await res.json();
    if (res.ok && data.access_token) {
      const session: OperatorSession = {
        email: data.user?.email || email.trim(),
        accessToken: data.access_token,
        expiresAt: Date.now() + ((data.expires_in || 3600) - 60) * 1000,
      };
      setStoredSession(session);
      return { success: true, session };
    } else {
      return {
        success: false,
        error: data.error_description || data.message || `Sign in failed with HTTP ${res.status}`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.name === 'AbortError' ? 'Authentication timed out' : (err.message || 'Network error during authentication'),
    };
  }
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Construct Supabase REST headers.
 * Uses authenticated operator session JWT if signed in; otherwise falls back to public anon key.
 */
export async function getSupabaseHeaders(settings: RloeSettings): Promise<Record<string, string>> {
  const session = getStoredSession();
  const token = session?.accessToken || settings.supabaseAnonKey;
  return {
    apikey: settings.supabaseAnonKey,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Fetch canonical inbound_intent_log rows from Supabase REST API.
 * Authenticated team members receive full verified intent log rows.
 */
export async function fetchInboundIntentLogs(settings: RloeSettings): Promise<InboundIntentLog[]> {
  if (!settings.supabaseUrl || !settings.supabaseAnonKey) {
    return [];
  }

  const endpoint = `${settings.supabaseUrl}/rest/v1/inbound_intent_log?select=*&order=created_at.desc&limit=100`;
  try {
    const headers = await getSupabaseHeaders(settings);
    const res = await fetchWithTimeout(endpoint, {
      method: 'GET',
      headers,
    });

    if (res.status === 401 || res.status === 403) {
      throw new Error(`Authentication required by database policy (HTTP ${res.status}). Please sign in.`);
    }

    if (!res.ok) {
      throw new Error(`Supabase query failed with HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    console.error('RLOE Error fetching inbound_intent_log:', err);
    throw err;
  }
}

/**
 * Fetch canonical rloe_telemetry rows from Supabase REST API.
 * Only returns real rows from the database. Never synthesizes fake execution records.
 */
export async function fetchRloeTelemetry(
  settings: RloeSettings
): Promise<{ rows: RloeTelemetry[]; isRestrictedByRls: boolean }> {
  if (!settings.supabaseUrl || !settings.supabaseAnonKey) {
    return { rows: [], isRestrictedByRls: false };
  }

  const endpoint = `${settings.supabaseUrl}/rest/v1/rloe_telemetry?select=*&order=created_at.desc&limit=100`;
  try {
    const headers = await getSupabaseHeaders(settings);
    const res = await fetchWithTimeout(endpoint, {
      method: 'GET',
      headers,
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return { rows: data, isRestrictedByRls: false };
      }
    } else if (res.status === 401 || res.status === 403) {
      return { rows: [], isRestrictedByRls: true };
    }
  } catch (err: any) {
    console.warn('RLOE rloe_telemetry query notice:', err);
  }

  return { rows: [], isRestrictedByRls: false };
}

/**
 * Fetch canonical system_error_log rows from Supabase REST API.
 */
export async function fetchSystemErrorLogs(settings: RloeSettings): Promise<SystemErrorLog[]> {
  if (!settings.supabaseUrl || !settings.supabaseAnonKey) {
    return [];
  }

  const endpoint = `${settings.supabaseUrl}/rest/v1/system_error_log?select=*&order=created_at.desc&limit=100`;
  try {
    const headers = await getSupabaseHeaders(settings);
    const res = await fetchWithTimeout(endpoint, {
      method: 'GET',
      headers,
    });

    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
    return [];
  } catch (err: any) {
    console.warn('RLOE system_error_log query notice:', err);
    return [];
  }
}

/**
 * Test connectivity to Supabase project.
 */
export async function testSupabaseConnection(settings: RloeSettings): Promise<ConnectionTestResult> {
  const start = performance.now();
  if (!settings.supabaseUrl) {
    return {
      service: 'supabase',
      status: 'error',
      message: 'Supabase Project URL is missing',
      testedAt: new Date().toISOString(),
    };
  }
  if (!settings.supabaseAnonKey) {
    return {
      service: 'supabase',
      status: 'error',
      message: 'Supabase Publishable/Anon Key is missing',
      testedAt: new Date().toISOString(),
    };
  }

  try {
    const headers = await getSupabaseHeaders(settings);
    const endpoint = `${settings.supabaseUrl}/rest/v1/inbound_intent_log?select=id&limit=1`;
    const res = await fetchWithTimeout(
      endpoint,
      {
        method: 'GET',
        headers,
      },
      5000
    );

    const latencyMs = Math.round(performance.now() - start);

    if (res.ok) {
      const session = getStoredSession();
      const authLabel = session ? `Authenticated as ${session.email}` : 'Public Anonymous session (RLS restricted)';
      return {
        service: 'supabase',
        status: 'success',
        message: `Connected successfully (${latencyMs}ms) — ${authLabel}`,
        latencyMs,
        testedAt: new Date().toISOString(),
      };
    } else {
      return {
        service: 'supabase',
        status: 'error',
        message: `HTTP ${res.status}: ${res.statusText}. Verify table access and team authentication.`,
        latencyMs,
        testedAt: new Date().toISOString(),
      };
    }
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      service: 'supabase',
      status: 'error',
      message: err.name === 'AbortError' ? 'Connection timed out after 5000ms' : (err.message || 'Network error reaching Supabase'),
      latencyMs,
      testedAt: new Date().toISOString(),
    };
  }
}

/**
 * Test connectivity to n8n Webhook Endpoint.
 */
export async function testN8nConnection(settings: RloeSettings): Promise<ConnectionTestResult> {
  const start = performance.now();
  if (!settings.n8nWebhookUrl) {
    return {
      service: 'n8n',
      status: 'error',
      message: 'n8n Webhook URL is missing',
      testedAt: new Date().toISOString(),
    };
  }

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    const res = await fetchWithTimeout(
      settings.n8nWebhookUrl,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ type: 'ping', client: 'rloe_dashboard', timestamp: new Date().toISOString() }),
      },
      5000
    );

    const latencyMs = Math.round(performance.now() - start);

    if (res.ok) {
      return {
        service: 'n8n',
        status: 'success',
        message: `Webhook endpoint reachable (${latencyMs}ms)`,
        latencyMs,
        testedAt: new Date().toISOString(),
      };
    } else {
      return {
        service: 'n8n',
        status: 'error',
        message: `HTTP ${res.status}: ${res.statusText}. Note: Server authorization headers are not exposed in browser code.`,
        latencyMs,
        testedAt: new Date().toISOString(),
      };
    }
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      service: 'n8n',
      status: 'error',
      message: err.name === 'AbortError' ? 'Webhook timed out after 5000ms' : (err.message || 'Network error reaching n8n webhook'),
      latencyMs,
      testedAt: new Date().toISOString(),
    };
  }
}

/**
 * Test connectivity to NVIDIA Agent proxy/endpoint.
 */
export async function testNvidiaConnection(settings: RloeSettings): Promise<ConnectionTestResult> {
  const start = performance.now();
  if (!settings.nvidiaEndpoint) {
    return {
      service: 'nvidia',
      status: 'idle',
      message: 'Proxy endpoint optional (server-side routing enabled by default)',
      testedAt: new Date().toISOString(),
    };
  }

  try {
    const res = await fetchWithTimeout(
      settings.nvidiaEndpoint,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: settings.nvidiaModel, prompt: 'ping' }),
      },
      5000
    );

    const latencyMs = Math.round(performance.now() - start);

    if (res.ok) {
      return {
        service: 'nvidia',
        status: 'success',
        message: `Agent endpoint operational (${latencyMs}ms)`,
        latencyMs,
        testedAt: new Date().toISOString(),
      };
    } else {
      return {
        service: 'nvidia',
        status: 'error',
        message: `HTTP ${res.status}: ${res.statusText}`,
        latencyMs,
        testedAt: new Date().toISOString(),
      };
    }
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      service: 'nvidia',
      status: 'error',
      message: err.name === 'AbortError' ? 'Endpoint timed out' : (err.message || 'Failed to reach agent endpoint'),
      latencyMs,
      testedAt: new Date().toISOString(),
    };
  }
}

/**
 * Dispatch an inbound signal simulation through the n8n webhook.
 */
export async function dispatchInboundSignal(
  settings: RloeSettings,
  payload: { company_domain: string; source: string; signals?: Record<string, any> }
): Promise<{ success: boolean; message: string; executionId?: string }> {
  if (settings.n8nWebhookUrl) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      const res = await fetchWithTimeout(settings.n8nWebhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...payload,
          visitor_anonymous_id: `anon_${Math.random().toString(36).substring(2, 9)}`,
          received_at: new Date().toISOString(),
          t_start: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        return {
          success: true,
          message: 'Signal accepted by n8n Webhook Inbound Gate (Trigger accepted; completion pending)',
          executionId: json.execution_id || json.executionId,
        };
      } else {
        return {
          success: false,
          message: `Webhook returned HTTP ${res.status}: ${res.statusText}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Failed to dispatch signal: ${err.message || 'Unknown network error'}`,
      };
    }
  }

  return {
    success: false,
    message: 'No n8n Webhook URL configured. Please configure your endpoint in Settings.',
  };
}
