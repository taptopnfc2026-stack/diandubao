import { defineConfig } from 'vite';

export default defineConfig({
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
