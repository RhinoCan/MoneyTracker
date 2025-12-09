import { defineConfig, mergeConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tsconfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath, URL } from 'node:url';

// 1. Define the base Vite configuration
const baseConfig = defineConfig({
    base: '/MoneyTracker/',
    plugins: [
        vue(),
        tsconfigPaths(),
    ],
    resolve: {
        alias: {
            // Alias for resolving absolute paths from '@/src'
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    }
});

// 2. Define the test-specific properties (the Vitest configuration block)
const testProperties = {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/vitest.setup.js'],

    logLevel: 'error',
};

// 3. Define the test configuration block
const testConfig = {
    test: {
        ...testProperties, // Spreading the base test properties

        // Use the moduleNameMapper property to mock assets
        moduleNameMapper: {
            // Target all CSS/SCSS files
            '\\.(css|scss)$': '<rootDir>/tests/style-mock.js',
        },
    }
};

// 4. Export the merged configuration (Base + Test)
export default mergeConfig(baseConfig, testConfig);