import { publicEnv } from "./runtimeConfig";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const GA_ID = publicEnv("VITE_GA4_ID");

export function initAnalytics(): void {
  if (!GA_ID || typeof document === "undefined") return;
  if (document.getElementById("ga4-script")) return;

  const script = document.createElement("script");
  script.id = "ga4-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID, { send_page_view: true });
}

export function trackEvent(name: string, params?: Record<string, string | number>): void {
  if (!GA_ID || !window.gtag) return;
  window.gtag("event", name, params);
}
