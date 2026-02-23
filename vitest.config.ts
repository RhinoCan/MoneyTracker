import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.js'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      // Coverage configuration
      coverage: {
        provider: 'v8',
        include: ['src/**'],
        exclude: [
          'src/plugins/**',    // Excludes vuetify.js
          'src/main.ts',       // Excludes the app entry point
          'src/types/**',      // Excludes TypeScript interfaces/types
          '**/*.d.ts',         // Excludes declaration files
          'src/utils/Logger.ts', // Optional: exclude if you don't want to track the wrapper
          'src/main.js'
        ],
        reporter: ['text', 'json', 'html'],
      },
      // The "deps" block for Vuetify support
      server: {
        deps: {
          inline: ['vuetify']
        }
      }
    }
  })
)