import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        global: 'window',
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        __API_BASE__: JSON.stringify(env.__API_BASE__ || 'https://share-it-k0ky.onrender.com')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'build',
        chunkSizeWarningLimit: 600,
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              charts: ['recharts'],
              stripe: ['@stripe/stripe-js', '@stripe/react-stripe-js'],
              websocket: ['@stomp/stompjs', 'sockjs-client']
            }
          }
        }
      }
    };
});
