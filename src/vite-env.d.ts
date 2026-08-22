/// <reference types="vite/client" />

/**
 * All of these are PUBLIC — Vite inlines them into the client bundle.
 * Secrets belong in Apps Script Script Properties, never here.
 */
interface ImportMetaEnv {
  readonly VITE_WHATSAPP_NUMBER?: string;
  readonly VITE_ORDERS_API_URL?: string;
  readonly VITE_GOOGLE_SHEETS_URL?: string;
  readonly VITE_GA_TRACKING_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
