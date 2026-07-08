import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_PAGES === '1' ? '/diandubao/' : '/',
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
