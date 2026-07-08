import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: process.env.GITHUB_PAGES === '1' ? '/diandubao/' : '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
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
});
