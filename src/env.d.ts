// env.d.ts

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV: string
  // Add other custom environment variables here if you create more
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}