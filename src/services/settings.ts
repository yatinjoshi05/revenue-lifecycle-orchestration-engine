import { RloeSettings, DEFAULT_SETTINGS } from '../types/settings';

const SETTINGS_STORAGE_KEY = 'rloe_gtm_client_settings_v1';

/**
 * Load client-safe configuration from localStorage.
 * Private server secrets are never persisted in localStorage.
 */
export function loadSettings(): RloeSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      supabaseUrl: (parsed.supabaseUrl && parsed.supabaseUrl.trim()) || DEFAULT_SETTINGS.supabaseUrl,
      supabaseAnonKey: (parsed.supabaseAnonKey && parsed.supabaseAnonKey.trim()) || DEFAULT_SETTINGS.supabaseAnonKey,
      n8nWebhookUrl: (parsed.n8nWebhookUrl && parsed.n8nWebhookUrl.trim()) || DEFAULT_SETTINGS.n8nWebhookUrl,
      // Ensure numeric fields are sanitized
      autoRefreshInterval: Number(parsed.autoRefreshInterval) || 0,
    };
  } catch (err) {
    console.error('Failed to load RLOE settings from storage', err);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Persist client-safe configuration to localStorage.
 */
export function saveSettings(settings: RloeSettings): void {
  try {
    // Sanitize any accidental whitespace or trailing slashes
    const sanitized: RloeSettings = {
      supabaseUrl: settings.supabaseUrl.trim().replace(/\/+$/, ''),
      supabaseAnonKey: settings.supabaseAnonKey.trim(),
      n8nWebhookUrl: settings.n8nWebhookUrl.trim(),
      nvidiaModel: settings.nvidiaModel.trim() || DEFAULT_SETTINGS.nvidiaModel,
      nvidiaEndpoint: settings.nvidiaEndpoint.trim(),
      autoRefreshInterval: Math.max(0, Math.min(300, Number(settings.autoRefreshInterval) || 0)),
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(sanitized));
  } catch (err) {
    console.error('Failed to save RLOE settings to storage', err);
    throw new Error('Unable to persist settings in browser storage');
  }
}

/**
 * Reset settings to default empty state.
 */
export function resetSettings(): void {
  try {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to reset RLOE settings', err);
  }
}
