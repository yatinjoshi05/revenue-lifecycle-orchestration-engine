export interface RloeSettings {
  supabaseUrl: string;
  supabaseAnonKey: string;
  n8nWebhookUrl: string;
  nvidiaModel: string;
  nvidiaEndpoint: string;
  autoRefreshInterval: number; // in seconds, 0 = disabled
}

export interface ConnectionTestResult {
  service: 'supabase' | 'n8n' | 'nvidia';
  status: 'idle' | 'testing' | 'success' | 'error';
  message: string;
  latencyMs?: number;
  testedAt?: string;
}

export const DEFAULT_SETTINGS: RloeSettings = {
  supabaseUrl: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '',
  supabaseAnonKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '',
  n8nWebhookUrl: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_N8N_WEBHOOK_URL) || '',
  nvidiaModel: 'nvidia/nemotron-3.5-lightning-30b-a3b',
  nvidiaEndpoint: '',
  autoRefreshInterval: 0,
};

