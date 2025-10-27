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
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      preserveEntrySignatures: 'allow-extension',
      external: (id) => {
        // Verhindere, dass @react-three/* in AvatarCanvas-Chunk gebundelt wird
        // Sie müssen aus react-vendor importieren
        return false; // Temporär - später angepasst
      },
      output: {
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
          'ui-vendor': ['lucide-react']
          // Babylon.js wird automatisch in separatem Chunk gebundelt
        }
      }
    }
  }
})
