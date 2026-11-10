import { useId, useRef, useState } from 'react';
import { apiFetch } from './lib/api';
import './AccessCodeForm.css';

export default function AccessCodeForm({ onActivated }: { onActivated?: () => void | Promise<void> }) {
  const headingId = useId();
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const inFlight = useRef(false);

  const redeem = async (event: React.FormEvent) => {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setMessage('');
    setFailed(false);
    try {
      const response = await apiFetch('/api/billing/redeem-access-code', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.detail || 'Could not activate access. Please retry.');
      setCode('');
      setMessage(result.already_redeemed ? 'Your lifetime access is already active.' : 'Lifetime yearly access activated. All current features are unlocked.');
      await onActivated?.();
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : 'Could not activate access. Please retry.');
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };

  return <form onSubmit={redeem} className="card glass access-code-form" aria-labelledby={headingId}>
    <h3 id={headingId}>Activate your access code</h3>
    <p>A valid launch code unlocks the yearly plan for your account, with lifetime access to all current features.</p>
    <label>Access code
      <input className="input" value={code} onChange={event => setCode(event.target.value)} required maxLength={100} autoComplete="off" autoCapitalize="characters" spellCheck={false} disabled={pending} placeholder="Enter your access code" />
    </label>
    <button className="btn btn-green" type="submit" disabled={pending || !code.trim()}>{pending ? 'Activating…' : 'Activate lifetime access'}</button>
    {message && <p className={`access-code-message ${failed ? 'is-error' : ''}`} role={failed ? 'alert' : 'status'}>{message}</p>}
  </form>;
}
