/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AGENT_DEMO_PAYER_PUBKEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
