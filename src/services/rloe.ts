import { InboundIntentLog, RloeTelemetry, SystemErrorLog } from '../types/rloe';
import { RloeSettings, ConnectionTestResult } from '../types/settings';

/**
 * Service to interact with the RLOE backend (Supabase canonical tables & n8n orchestration webhooks).
 * Employs timeouts, error normalization, and client-safe credentials.
 */

const DEFAULT_TIMEOUT_MS = 8000;

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
 * Fetch canonical inbound_intent_log rows from Supabase REST API
 */
export async function fetchInboundIntentLogs(settings: RloeSettings): Promise<InboundIntentLog[]> {
  if (!settings.supabaseUrl || !settings.supabaseAnonKey) {
    return [];
  }

  const endpoint = `${settings.supabaseUrl}/rest/v1/inbound_intent_log?select=*&order=created_at.desc&limit=100`;
  try {
    const res = await fetchWithTimeout(endpoint, {
      method: 'GET',
      headers: {
        apikey: settings.supabaseAnonKey,
        Authorization: `Bearer ${settings.supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Supabase query failed with HTTP status ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    console.error('RLOE Error fetching inbound_intent_log:', err);
    throw new Error(err.message || 'Unable to connect to Supabase inbound_intent_log');
  }
}

/**
 * Fetch canonical rloe_telemetry rows from Supabase REST API
 */
export async function fetchRloeTelemetry(settings: RloeSettings): Promise<RloeTelemetry[]> {
  if (!settings.supabaseUrl || !settings.supabaseAnonKey) {
    return [];
  }

  const endpoint = `${settings.supabaseUrl}/rest/v1/rloe_telemetry?select=*&order=created_at.desc&limit=100`;
  try {
    const res = await fetchWithTimeout(endpoint, {
      method: 'GET',
      headers: {
        apikey: settings.supabaseAnonKey,
        Authorization: `Bearer ${settings.supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Supabase query failed with HTTP status ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    console.error('RLOE Error fetching rloe_telemetry:', err);
    throw new Error(err.message || 'Unable to connect to Supabase rloe_telemetry');
  }
}

/**
 * Fetch canonical system_error_log rows from Supabase REST API
 */
export async function fetchSystemErrorLogs(settings: RloeSettings): Promise<SystemErrorLog[]> {
  if (!settings.supabaseUrl || !settings.supabaseAnonKey) {
    return [];
  }

  const endpoint = `${settings.supabaseUrl}/rest/v1/system_error_log?select=*&order=created_at.desc&limit=100`;
  try {
    const res = await fetchWithTimeout(endpoint, {
      method: 'GET',
      headers: {
        apikey: settings.supabaseAnonKey,
        Authorization: `Bearer ${settings.supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Supabase query failed with HTTP status ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    console.error('RLOE Error fetching system_error_log:', err);
    throw new Error(err.message || 'Unable to connect to Supabase system_error_log');
  }
}

/**
 * Test connectivity to Supabase project
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
      message: 'Supabase Anon/Publishable Key is missing',
      testedAt: new Date().toISOString(),
    };
  }

  try {
    // Health / schema check on inbound_intent_log
    const endpoint = `${settings.supabaseUrl}/rest/v1/inbound_intent_log?select=id&limit=1`;
    const res = await fetchWithTimeout(endpoint, {
      method: 'GET',
      headers: {
        apikey: settings.supabaseAnonKey,
        Authorization: `Bearer ${settings.supabaseAnonKey}`,
      },
    }, 5000);

    const latencyMs = Math.round(performance.now() - start);

    if (res.ok) {
      return {
        service: 'supabase',
        status: 'success',
        message: `Connected successfully (${latencyMs}ms)`,
        latencyMs,
        testedAt: new Date().toISOString(),
      };
    } else {
      return {
        service: 'supabase',
        status: 'error',
        message: `HTTP ${res.status}: ${res.statusText}. Verify tables and policies.`,
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
 * Test connectivity to n8n Webhook / API Endpoint
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
    const res = await fetchWithTimeout(
      settings.n8nWebhookUrl,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ping', client: 'gtm_crm_frontend', timestamp: new Date().toISOString() }),
      },
      5000
    );

    const latencyMs = Math.round(performance.now() - start);

    if (res.ok) {
      return {
        service: 'n8n',
        status: 'success',
        message: `Webhook reachable (${latencyMs}ms)`,
        latencyMs,
        testedAt: new Date().toISOString(),
      };
    } else {
      return {
        service: 'n8n',
        status: 'error',
        message: `HTTP ${res.status}: ${res.statusText}`,
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
 * Test connectivity to NVIDIA Agent proxy/endpoint
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
 * Trigger an inbound signal simulation through the n8n webhook or local test gate
 */
export async function dispatchInboundSignal(
  settings: RloeSettings,
  payload: { company_domain: string; source: string; signals?: Record<string, any> }
): Promise<{ success: boolean; message: string; executionId?: string }> {
  if (settings.n8nWebhookUrl) {
    try {
      const res = await fetchWithTimeout(settings.n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          message: 'Signal successfully accepted by n8n Webhook Inbound Gate',
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
