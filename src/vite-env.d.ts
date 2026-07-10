/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_VWORLD_API_KEY?: string
  readonly VITE_DEV_ANDROID_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
