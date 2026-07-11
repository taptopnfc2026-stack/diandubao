import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { saasMockMiddleware } from './mock/saasMock.js';

export default defineConfig({
  base: process.env.GITHUB_PAGES === '1' ? '/diandubao/' : '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        saas: resolve(__dirname, 'saas.html'),
        tenant: resolve(__dirname, 'tenant.html'),
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://diandu.xiongmaoxiazai.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  plugins: [
    {
      name: 'saas-mock',
      configureServer(server) {
        server.middlewares.use(saasMockMiddleware());
      },
    },
  ],
});
