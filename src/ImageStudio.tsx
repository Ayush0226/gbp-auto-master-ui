import { useEffect, useState } from 'react';
import { API_URL, apiFetch } from './lib/api';

export type ImageAsset = { id: string; public_url: string; width?: number; height?: number };
type Providers = { cloudflare_available: boolean; pollinations_available: boolean; pollinations_connected: boolean };

export default function ImageStudio({ onSelect }: { onSelect: (asset: ImageAsset) => void }) {
    const [providers, setProviders] = useState<Providers | null>(null);
    const [provider, setProvider] = useState('cloudflare');
    const [prompt, setPrompt] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [asset, setAsset] = useState<ImageAsset | null>(null);
    useEffect(() => {
        let active = true;
        apiFetch(`${API_URL}/api/images/providers`).then(async response => {
            if (!response.ok) throw new Error('Could not load image-provider connections');
            const data = await response.json();
            if (active) setProviders(data);
        }).catch(reason => { if (active) setError(reason.message); });
        return () => { active = false; };
    }, []);

    const connect = async () => {
        setBusy(true); setError('');
        try {
            const response = await apiFetch(`${API_URL}/api/images/pollinations/connect`, { method:'POST', headers:{'Content-Type':'application/json'}, body:'{}' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Could not connect the image provider');
            window.location.assign(data.authorization_url);
        } catch (reason: any) { setError(reason.message); setBusy(false); }
    };
    const generate = async () => {
        setBusy(true); setError('');
        try {
            const response = await apiFetch(`${API_URL}/api/images/generate`, {
                method:'POST', headers:{'Content-Type':'application/json'},
                body:JSON.stringify({request_id:crypto.randomUUID(), provider, prompt:prompt.trim()}),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Could not generate this image');
            setAsset(data.asset);
        } catch (reason: any) { setError(reason.message); }
        finally { setBusy(false); }
    };
    const disconnect = async () => {
        setBusy(true); setError('');
        try {
            const response = await apiFetch(`${API_URL}/api/images/pollinations`, {method:'DELETE'});
            if (!response.ok) throw new Error('Could not disconnect the image provider');
            setProviders(value => value ? {...value, pollinations_connected:false} : value);
        } catch (reason: any) { setError(reason.message); }
        finally { setBusy(false); }
    };
    const ready = provider === 'cloudflare' ? providers?.cloudflare_available : providers?.pollinations_connected;
    return <div className="card-sm" style={{marginTop:16, minWidth:0}}>
        <h4 style={{marginTop:0}}>Create a photo</h4>
        <p style={{fontSize:13}}>Describe an image, review the preview, then attach it to your campaign.</p>
        {!providers && !error && <p role="status">Loading image connections…</p>}
        {providers && <>
            <label className="field-label" htmlFor="image-provider">Image provider</label>
            <select id="image-provider" className="input" value={provider} disabled={busy} onChange={e => setProvider(e.target.value)}>
                <option value="cloudflare">Shared free allowance{!providers.cloudflare_available ? ' — setup pending' : ''}</option>
                {(providers.pollinations_available || providers.pollinations_connected) && <option value="pollinations">My Pollinations account</option>}
            </select>
            {provider === 'pollinations' && <div style={{margin:'10px 0'}}>
                <p style={{fontSize:12}}>Uses your provider balance and the budget you approve. Provider allowances, charges and expiry apply.</p>
                {providers.pollinations_connected ? <button className="btn btn-ghost btn-sm" disabled={busy} onClick={disconnect}>Disconnect image account</button> :
                    <button className="btn btn-ghost btn-sm" disabled={busy || !providers.pollinations_available} onClick={connect}>{providers.pollinations_available ? 'Connect Pollinations' : 'Provider setup pending'}</button>}
            </div>}
            {provider === 'cloudflare' && <p style={{fontSize:12}}>{providers.cloudflare_available ? 'Availability depends on the shared provider allowance. Images are never published without scheduling.' : 'Image generation is awaiting account setup by the app administrator. You can still upload a photo to your campaign.'}</p>}
            <label className="field-label" htmlFor="image-prompt">Image description</label>
            <textarea id="image-prompt" rows={3} maxLength={2000} value={prompt} disabled={busy} onChange={e => setPrompt(e.target.value)} placeholder="A warm, inviting café with fresh coffee and morning sunlight" />
            <button className="btn btn-ghost btn-sm" disabled={busy || !ready || prompt.trim().length < 5} onClick={generate}>{busy ? 'Working…' : 'Generate preview'}</button>
        </>}
        {error && <p role="alert" style={{overflowWrap:'anywhere', color:'var(--red, #b63b32)'}}>{error}</p>}
        {asset && <div style={{marginTop:12}}><img src={asset.public_url} alt="Generated campaign preview" style={{display:'block',width:'100%',maxWidth:420,borderRadius:12}} />
            <p style={{fontSize:12}}>Check details and text before publishing.</p><button className="btn btn-green btn-sm" onClick={() => onSelect(asset)}>Use this image</button></div>}
    </div>;
}
