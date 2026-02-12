import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/patients': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/therapists': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/therapist': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/availability': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/logout': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/portal': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/secretary': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    }
  }
})
