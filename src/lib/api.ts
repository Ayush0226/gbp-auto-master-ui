import { supabase } from './supabase';

export const API_URL = (import.meta.env.VITE_API_URL || 'https://gbp-auto-master-backend-us.onrender.com').replace(/\/$/, '');

/** Attach the Supabase session only to this app's backend, never third parties. */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const url = new URL(input, API_URL);
  if (!url.pathname.startsWith('/api/') || ![new URL(API_URL).origin, 'https://gbp-auto-master-backend-us.onrender.com'].includes(url.origin)) {
    return fetch(input, init);
  }
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) throw new Error('Your session expired. Please sign in again.');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${session.access_token}`);
  return fetch(`${API_URL}${url.pathname}${url.search}`, { ...init, headers });
}
