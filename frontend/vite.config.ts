import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    // Allow all ngrok domains (or use true to allow all hosts)
    allowedHosts: ['.ngrok-free.app', '.ngrok.io', '.ngrok.app'],
    hmr: {
      clientPort: 443
    },
    proxy: {
      '/api': {
        target: 'http://backend:3001',
        changeOrigin: true
      },
      '/ide': {
        target: 'http://code-server:8080',
        changeOrigin: true,
        ws: true
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: ['.ngrok-free.app', '.ngrok.io', '.ngrok.app']
  }
})
