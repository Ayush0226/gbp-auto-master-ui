import { supabase } from './supabase';

export const API_URL = (import.meta.env.VITE_API_URL || 'https://gbp-auto-master-backend-us.onrender.com').replace(/\/$/, '');

/** Attach the Supabase session only to this app's backend, never third parties. */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const url = new URL(input, API_URL);
  if (!url.pathname.startsWith('/api/') || ![new URL(API_URL).origin, 'https://gbp-auto-master-backend-us.onrender.com'].includes(url.origin)) {
    return fetch(input, init);
  }
  let { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw new Error('Could not restore your sign-in session. Please reload and try again.');
  if (!session) {
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error || !refreshed.data.session) throw new Error('Your sign-in has expired. Please sign in again.');
    session = refreshed.data.session;
  }

  const send = (accessToken: string) => {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${accessToken}`);
    return fetch(`${API_URL}${url.pathname}${url.search}`, { ...init, headers });
  };
  const response = await send(session.access_token);
  if (response.status !== 401) return response;

  // A JWT can expire while an API call is in flight. Refresh once and retry
  // so transient expiry does not look like the user was signed out.
  const refreshed = await supabase.auth.refreshSession();
  if (refreshed.error || !refreshed.data.session) return response;
  return send(refreshed.data.session.access_token);
}
