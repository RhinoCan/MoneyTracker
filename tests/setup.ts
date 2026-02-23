import { vi } from 'vitest'
import { config } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Global mock for the Logger to keep the console clean
vi.mock('@/utils/Logger', () => ({
  logWarning: vi.fn(),
  logException: vi.fn(),
  logInfo: vi.fn(),
  logSuccess: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock window.matchMedia (required by Vuetify)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Fix for Vuetify VOverlay/VMenu crashing in JSDOM
if (typeof window !== 'undefined' && !window.visualViewport) {
  (window as any).visualViewport = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    width: 1024,
    height: 768,
    offsetLeft: 0,
    offsetTop: 0,
    pageLeft: 0,
    pageTop: 0,
    scale: 1,
  };
}

// Create Vuetify instance for tests
const vuetify = createVuetify({
  components,
  directives,
})

// Install it globally for all tests
config.global.plugins = [vuetify]

// Suppress Vue warnings in tests
const originalWarn = console.warn
console.warn = (...args: any[]) => {
  const msg = args[0]?.toString() || ''
  if (
    msg.includes('Could not parse CSS') ||
    msg.includes('App already provides property') ||
    msg.includes('[Vue warn]')
  ) {
    return
  }
  originalWarn(...args)
}