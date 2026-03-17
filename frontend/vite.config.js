import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/predict': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/health': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/restaurants': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/get-restaurant-image': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/inscripciones': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/auth': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/ocr': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/company': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/ratings': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/rankings': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
