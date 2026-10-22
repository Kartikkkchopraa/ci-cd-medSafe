import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Forward API calls to the backend so the browser sees one origin (no CORS needed)
        '/api': env.API_PROXY_TARGET || 'http://localhost:3000',
      },
    },
  }
})
