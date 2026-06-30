/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the backend API. Placeholder until the backend exists. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
