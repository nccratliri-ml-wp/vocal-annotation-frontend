import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/

// This code is currently unused, but I leave it for future reference, in case another thirdparty API hosted on a different server is needed fro the application
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5050,
    proxy: {
      '/api': {
        target: 'http://vocallbase.evolvinglanguage.ch',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    },
  },
  plugins: [react()],
})


