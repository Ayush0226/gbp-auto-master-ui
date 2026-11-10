import { useEffect, useRef, useState } from 'react';
import { API_URL, apiFetch } from './lib/api';

export default function ImageConnect() {
    const started = useRef(false);
    const [message, setMessage] = useState('Completing your image-provider connection…');
    useEffect(() => {
        if (started.current) return;
        started.current = true;
        const params = new URLSearchParams(window.location.search);
        window.history.replaceState(null, '', '/image-connect');
        if (params.has('error') || !params.get('code') || !params.get('state')) {
            setMessage('The connection was cancelled or expired. Return to the Content Studio to try again.'); return;
        }
        apiFetch(`${API_URL}/api/images/pollinations/callback`, {
            method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({code:params.get('code'),state:params.get('state')}),
        }).then(async response => {
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Could not complete the connection');
            window.location.replace('/dashboard-v2?view=calendar');
        }).catch(reason => setMessage(reason.message));
    }, []);
    return <main style={{padding:32,maxWidth:640,margin:'auto'}}><h1>Image account</h1><p role="status">{message}</p><a href="/dashboard-v2?view=calendar">Return to Content Studio</a></main>;
}
