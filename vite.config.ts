import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/foodiepair/',
  server: {
    host: true,
    port: 5173,
    allowedHosts: [
      'bartualfdez.asuscomm.com'
    ],
    hmr: {
      // Use your public domain for the WebSocket connection
      host: 'bartualfdez.asuscomm.com',
      // Force SSL for the websocket (needed for https sites)
      protocol: 'wss',
      // We leave 'path' out because 'base' handles it automatically now
    }
  }
})
