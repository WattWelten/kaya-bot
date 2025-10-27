import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_ID__: JSON.stringify(process.env.VITE_BUILD_ID || 'dev'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString())
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ws/, '')
      }
    }
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
    strictPort: false
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
        manualChunks: (id) => {
          // ⚠️ WICHTIG: React ZUERST - Höchste Priorität
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('react/jsx-runtime')) {
            return 'react-vendor';
          }
          
          // Three.js KOMPLETT SEPARAT (mit eigenen React-Hooks)
          // Muss NACH React geladen werden!
          if (id.includes('node_modules/three') || id.includes('node_modules/@react-three')) {
            return 'three-vendor';
          }
          
          // UI Vendor (Icons, Utilities) - Benötigen React
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/clsx')) {
            return 'ui-vendor';
          }
          
          // Audio Modules
          if (id.includes('/hooks/useAudio') || id.includes('/services/AudioService')) {
            return 'audio-vendor';
          }
          
          // Chat Components
          if (id.includes('/components/ChatPane') || id.includes('/components/VoiceButton')) {
            return 'chat-vendor';
          }
          
          // Pages
          if (id.includes('/pages/')) {
            return 'pages';
          }
        }
      }
    }
  }
})
