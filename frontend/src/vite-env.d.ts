/// <reference types="vite/client" />

interface Window {
  forgerApp?: {
    getContext?: () => Promise<{ locale?: string }>;
  };
}
