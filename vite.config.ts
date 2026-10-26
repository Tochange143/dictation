import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        timeout: 1000,
        proxyTimeout: 1000,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res: any) => {
            // If backend server is not running, return 503 silently without stalling Vite
            if (res && !res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ offline: true, message: 'Backend offline, using localStorage' }));
            }
          });
        }
      }
    }
  }
});
