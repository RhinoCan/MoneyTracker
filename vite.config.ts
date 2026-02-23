import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tsconfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: '/MoneyTracker/',
  plugins: [
    vue(),
    tsconfigPaths(),
  ],
  server: {
    fs: {
      // We are expanding the allow list to include the parent directory
      // where Vite is seeing the @mdi fonts.
      allow: [
        fileURLToPath(new URL('./', import.meta.url)), // Project root
        '..'                                           // Parent directory (C:/Vue/)
      ]
    }
  },
  optimizeDeps: {
    include: ['@mdi/font/css/materialdesignicons.css']
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})