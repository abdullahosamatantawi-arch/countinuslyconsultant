/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    test: { globals: true, environment: "jsdom", setupFiles: ["./src/test/setup.ts"] },
    server: {
      port: 3002,
      proxy: {
        '/n8n-webhook-consultant': {
          target: env.VITE_CONSULTANT_APP_WEBHOOK,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/n8n-webhook-consultant/, ''),
          secure: false,
        },
        '/n8n-webhook': {
          target: env.VITE_N8N_WEBHOOK_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/n8n-webhook/, ''),
          secure: false,
        },
        '/n8n-extract-license': {
          target: env.VITE_N8N_EXTRACT_WEBHOOK,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/n8n-extract-license/, ''),
          secure: false,
        },
        '/anthropic-api': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/anthropic-api/, ''),
          secure: false,
        },
        '/resend-api': {
          target: 'https://api.resend.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/resend-api/, ''),
          secure: false,
        },
      },
    },
  }
})
