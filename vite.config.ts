import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_BACKEND_URL || env.BACKEND_URL || 'http://localhost:4000';

  return {
    base: './',
    plugins: [react()],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || env.SUPABASE_URL || ''),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || ''),
      'import.meta.env.VITE_N8N_WEBHOOK_URL': JSON.stringify(env.VITE_N8N_WEBHOOK_URL || env.N8N_WEBHOOK_PROD_URL || ''),
    },
    server: {
      port: 3000,
      host: '127.0.0.1',
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              // Server-side Development BFF / Proxy Credential Injection:
              // 1. Inject server-to-server API key if present on host and not supplied by client
              const serverApiKey = env.NEXUS_API_KEY || process.env.NEXUS_API_KEY || 'nexus-dev-api-key-2026';
              if (serverApiKey && !proxyReq.getHeader('x-nexus-api-key') && !proxyReq.getHeader('authorization')) {
                proxyReq.setHeader('x-nexus-api-key', serverApiKey);
              }

              // 2. For seamless local dev frontend review without manual token pasting:
              // Inject dev operator token if client did not supply custom authorization
              const devOperatorToken = env.DEV_OPERATOR_TOKEN || process.env.DEV_OPERATOR_TOKEN || 'nexus-dev-operator-token';
              if (devOperatorToken && !proxyReq.getHeader('authorization')) {
                proxyReq.setHeader('authorization', `Bearer ${devOperatorToken}`);
              }
            });
          }
        },
        '/health': {
          target: backendTarget,
          changeOrigin: true
        },
        '/ready': {
          target: backendTarget,
          changeOrigin: true
        }
      }
    }
  };
});
