import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const proxy = (target: string, prefix: string) => ({
  target,
  changeOrigin: true,
  rewrite: (path: string) => path.replace(prefix, ''),
});

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api/orderhub': proxy('http://localhost:3000', '/api/orderhub'),
      '/api/inventory': proxy('http://localhost:3001', '/api/inventory'),
      '/api/notifications': proxy(
        'http://localhost:3002',
        '/api/notifications',
      ),
    },
  },
});
