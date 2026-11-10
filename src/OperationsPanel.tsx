import { useEffect, useState } from 'react';
import { API_URL, apiFetch } from './lib/api';

const names: Record<string,string> = {
    '/api/cron/publish-scheduled':'Scheduled publishing',
    '/api/cron/reply-reviews':'Review replies',
    '/api/cron/scrub-calendar':'Storage cleanup',
};
export default function OperationsPanel() {
    const [status,setStatus]=useState<any>(null);
    const [error,setError]=useState('');
    const [busy,setBusy]=useState(false);
    const refresh=async()=>{
        setBusy(true);setError('');
        try {
            const response=await apiFetch(`${API_URL}/api/admin/operations`);
            if(!response.ok) throw new Error('Could not load system status');
            setStatus(await response.json());
        } catch(reason:any){setError(reason.message);}
        finally{setBusy(false);}
    };
    useEffect(()=>{void refresh();},[]);
    return <section className="card glass" style={{marginBottom:24}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><h3>Automation health</h3><button className="btn btn-ghost btn-sm" disabled={busy} onClick={refresh}>{busy?'Checking…':'Refresh status'}</button></div>
        {error&&<p role="alert">{error}</p>}
        {status&&<><p role="status">{status.healthy?'Scheduled services are healthy.':'Some scheduled work needs attention.'}</p>
            {status.jobs.map((job:any)=><div key={job.job_key} className="card-sm" style={{marginTop:8}}><strong>{names[job.job_key]||job.job_key}</strong><p>{job.healthy?'Healthy':'Needs attention'} · {job.status}</p><small>Last update: {job.updated_at?new Date(job.updated_at).toLocaleString():'No completed run'}</small></div>)}
            {!!Object.values(status.held_deliveries).reduce((sum:number,value)=>sum+Number(value),0)&&<p role="alert">A delivery is held for reconciliation. Check Google before retrying it.</p>}
            <small>Checked {new Date(status.checked_at).toLocaleString()}</small>
        </>}
    </section>;
}
