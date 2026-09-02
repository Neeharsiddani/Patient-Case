import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const basePath = env.VITE_BASE_PATH || (process.env.GITHUB_PAGES === 'true' ? '/Patient-Case/' : '/');

  return {
    base: basePath,
    plugins: [
      react(),
      tailwindcss()
    ],
    server: {
      port: 3000,
      open: false,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:5000',
          changeOrigin: true
        }
      }
    }
  };
});
