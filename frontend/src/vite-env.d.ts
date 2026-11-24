/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_USE_MOCK?: string;
  readonly VITE_DEFAULT_BRANCH_ID?: string;
  readonly VITE_DEFAULT_BRANCH_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
