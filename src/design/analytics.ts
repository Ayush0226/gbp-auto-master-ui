type EventDetail = Record<string, string | number | boolean | null>;

const STORAGE_KEY = 'gbp_analytics_consent';

export function analyticsConsent() {
  return localStorage.getItem(STORAGE_KEY);
}

export function setAnalyticsConsent(value: 'allowed' | 'essential') {
  localStorage.setItem(STORAGE_KEY, value);
  window.dispatchEvent(new CustomEvent('gbp:consent', { detail: value }));
}

export function trackEvent(name: string, detail: EventDetail = {}) {
  window.dispatchEvent(new CustomEvent('gbp:analytics', { detail: { name, ...detail } }));
  if (analyticsConsent() !== 'allowed') return;
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined;
  if (!endpoint) return;
  const payload = JSON.stringify({ name, path: window.location.pathname, detail, occurred_at: new Date().toISOString() });
  if (navigator.sendBeacon) navigator.sendBeacon(endpoint, new Blob([payload], { type: 'application/json' }));
  else void fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true });
}
