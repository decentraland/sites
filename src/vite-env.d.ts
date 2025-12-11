/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REACT_APP_DCL_DEFAULT_ENV?: string
  readonly MODE: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly SSR: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
