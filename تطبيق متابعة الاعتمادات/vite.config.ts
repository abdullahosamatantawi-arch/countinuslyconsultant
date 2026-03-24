import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/n8n-webhook': {
          target: env.VITE_N8N_WEBHOOK_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/n8n-webhook/, ''),
          secure: false,
        },
        '/n8n-email-webhook': {
          target: env.VITE_N8N_EMAIL_WEBHOOK_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/n8n-email-webhook/, ''),
          secure: false,
        },
      },
    },
  }
})
