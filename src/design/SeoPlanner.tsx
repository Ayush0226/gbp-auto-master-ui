import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import SiteShell from './SiteShell';
import Icon from './Icon';
import './workspace.css';

type Category = 'on-page' | 'off-page' | 'monitor';
type Entry = { id: string; title: string; date: string; url: string; category: string; metric: string; baseline: string; current: string; notes: string };
type PlannerData = { checked: string[]; entries: Entry[] };
const tasks = {
  'on-page': [
    ['title','Give each page a clear, unique title','Match the actual service and location. Avoid repeating the same title across every page.','Content'],
    ['service','Make the service and location easy to understand','Explain what you do, where you work, and how a customer can contact you.','Content'],
    ['links','Connect useful pages with descriptive links','Link services, location pages, and contact details so customers can find the next step.','Navigation'],
    ['mobile','Review the mobile experience','Check readable text, working forms, image sizes, and loading performance on a real phone.','Experience'],
    ['index','Check crawling and indexing','Use Google Search Console to inspect your important URLs and review indexing issues.','Technical'],
    ['schema','Validate relevant structured data','Describe your real business accurately. Validate markup; do not invent ratings or reviews.','Technical'],
  ],
  'off-page': [
    ['details','Keep your business details consistent','Check your name, address, phone number, and website on Google and relevant directories.','Citations'],
    ['directories','Review your important local listings','Record credible industry or local directories. Correct outdated details and duplicate listings.','Citations'],
    ['reviews','Ask for genuine customer feedback','Invite honest reviews without incentives. Reply thoughtfully and keep feedback useful.','Reputation'],
    ['mentions','Record genuine local mentions','Keep a record of coverage, local partnerships, and relevant links earned by your business.','Authority'],
    ['quality','Check the quality of referring sites','Focus on relevance and usefulness. Do not buy links or use automated link schemes.','Authority'],
  ],
};
function loadData(key: string): PlannerData {
  try { const parsed: unknown = JSON.parse(localStorage.getItem(key) || 'null');
    if (parsed && typeof parsed === 'object' && 'checked' in parsed && 'entries' in parsed) {
      const p = parsed as PlannerData;
      if (Array.isArray(p.checked) && p.checked.every(v=>typeof v==='string') && Array.isArray(p.entries) && p.entries.every(v=>v && ['id','title','date','url','category','metric','baseline','current','notes'].every(k=>typeof v[k as keyof Entry]==='string'))) return p;
    }
  } catch { /* An empty workspace is safer than interpreting invalid stored data. */ }
  return { checked: [], entries: [] };
}
const blankEntry = () => ({ title:'', date:new Date().toISOString().slice(0,10), url:'', category:'On-page', metric:'Local rank', baseline:'', current:'', notes:'' });
export function SeoPlanner({ storageScope = 'preview', initialTab }: { storageScope?: string; initialTab?: Category }) {
  const storageKey = `gbp-seo-planner-v1:${storageScope}`;
  const [data,setData] = useState<PlannerData>(()=>loadData(storageKey));
  const [tab,setTab] = useState<Category>(initialTab || 'on-page');
  const [composer,setComposer] = useState(false);
  const [entry,setEntry] = useState(blankEntry);
  const [message,setMessage] = useState('');
  useEffect(()=>{setData(loadData(storageKey));},[storageKey]);
  function save(next:PlannerData) {
    try { localStorage.setItem(storageKey,JSON.stringify(next)); setData(next); setMessage('Saved on this browser.'); }
    catch { setMessage('Your browser could not save this change. Export your existing work before clearing storage.'); }
  }
  function toggle(id:string) { save({...data,checked:data.checked.includes(id)?data.checked.filter(v=>v!==id):[...data.checked,id]}); }
  function submit(e:FormEvent) {
    e.preventDefault(); if(!entry.title.trim()) return;
    save({...data,entries:[{...entry,title:entry.title.trim(),id:crypto.randomUUID()},...data.entries]});
    setEntry(blankEntry()); setComposer(false);setTab('monitor');
  }
  function exportData() {
    const url=URL.createObjectURL(new Blob([JSON.stringify({exportedAt:new Date().toISOString(),...data},null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='gbp-seo-workspace.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('Workspace exported.');
  }
  const checklist=tab==='monitor'?[]:tasks[tab];
  return <div className="st-planner">
    <div className="st-work-section-heading"><div><span className="st-eyebrow">SMALL CHANGES. A CLEARER RECORD.</span><h2>Your SEO workbench</h2><p>Plan the work. Record the change. Review the evidence.</p></div><button className="st-button st-button-outline" onClick={exportData}><Icon name="download" size={15}/> Export your work</button></div>
    <div className="st-inline-note"><Icon name="shield" size={17}/><span>Manual workspace · Saved in this browser only. No website crawler, backlink feed, or automatic monitoring is connected.</span></div>
    <div className="st-planner-tabs" role="tablist" aria-label="SEO workbench">{([['on-page','On-page SEO','globe'],['off-page','Off-page SEO','link'],['monitor','Changes & monitoring','chart']] as const).map(([id,label,icon])=><button role="tab" id={`seo-tab-${id}`} aria-selected={tab===id} aria-controls="seo-panel" key={id} onClick={()=>setTab(id)} className={tab===id?'active':''}><Icon name={icon} size={17}/>{label}{id==='monitor'&&data.entries.length>0&&<small>{data.entries.length}</small>}</button>)}</div>
    <div role="tabpanel" id="seo-panel" aria-labelledby={`seo-tab-${tab}`}>
    {tab!=='monitor'?<><div className="st-checklist-heading"><div><h3>{tab==='on-page'?'Make every page work a little harder.':'Build a consistent local presence.'}</h3><p>A practical checklist, not an automated audit score.</p></div><span className="st-pill">{checklist.filter(t=>data.checked.includes(t[0])).length} / {checklist.length} completed</span></div><div className="st-checklist">{checklist.map(([id,title,body,tag])=><label key={id} className={`st-check-task ${data.checked.includes(id)?'is-complete':''}`}><input type="checkbox" checked={data.checked.includes(id)} onChange={()=>toggle(id)} /><span className="st-task-check"><Icon name="check" size={14}/></span><span className="st-task-copy"><b>{title}</b><span>{body}</span></span><small>{tag}</small></label>)}</div><a href="https://developers.google.com/search/docs/fundamentals/seo-starter-guide" target="_blank" rel="noreferrer" className="st-seo-source">Based on practical Google Search guidance <Icon name="arrowUp" size={13}/></a></>:
    <><div className="st-checklist-heading"><div><h3>What changed? What happened next?</h3><p>Record observations without assuming that a change caused a ranking movement.</p></div><button className="st-button st-button-green" onClick={()=>setComposer(!composer)}><Icon name={composer?'close':'plus'} size={16}/>{composer?'Close form':'Log a change'}</button></div>
    {composer&&<form className="st-change-form" onSubmit={submit}><label className="st-form-wide">What did you change?<input required maxLength={180} value={entry.title} onChange={e=>setEntry({...entry,title:e.target.value})} placeholder="Updated the café location page title" autoFocus /></label><label>Date<input required type="date" value={entry.date} onChange={e=>setEntry({...entry,date:e.target.value})}/></label><label>Area<select value={entry.category} onChange={e=>setEntry({...entry,category:e.target.value})}><option>On-page</option><option>Off-page</option><option>Google Business Profile</option></select></label><label className="st-form-wide">Page or citation URL (optional)<input type="url" value={entry.url} onChange={e=>setEntry({...entry,url:e.target.value})} placeholder="https://yourbusiness.com/location"/></label><label>Metric<select value={entry.metric} onChange={e=>setEntry({...entry,metric:e.target.value})}><option>Local rank</option><option>Search impressions</option><option>Website clicks</option><option>Review count</option><option>Other</option></select></label><label>Baseline<input type="number" min="0" step="any" value={entry.baseline} onChange={e=>setEntry({...entry,baseline:e.target.value})} placeholder="Before"/></label><label>Latest measurement<input type="number" min="0" step="any" value={entry.current} onChange={e=>setEntry({...entry,current:e.target.value})} placeholder="After (optional)"/></label><label className="st-form-wide">Evidence and observations<textarea rows={3} value={entry.notes} maxLength={3000} onChange={e=>setEntry({...entry,notes:e.target.value})} placeholder="Record your keyword, search area, measurement date and source. Add context such as seasonal changes."/></label><button type="submit" className="st-button st-button-green">Save change <Icon name="check" size={16}/></button></form>}
    {data.entries.length===0?<div className="st-empty"><Icon name="chart" size={35}/><h3>Your next improvement starts with a baseline.</h3><p>Log a website or profile change, then add measurements from a rank report or Search Console.</p>{!composer&&<button className="st-button st-button-outline" onClick={()=>setComposer(true)}>Log your first change <Icon name="plus" size={15}/></button>}</div>:<div className="st-log-list">{data.entries.map(item=><article key={item.id} className="st-log-entry"><div><span className="st-pill">{item.category}</span><time>{item.date}</time></div><h3>{item.title}</h3>{item.url&&<a href={item.url} target="_blank" rel="noreferrer">{item.url}<Icon name="arrowUp" size={12}/></a>}<div className="st-log-measurement"><span>{item.metric}</span><b>{item.baseline||'—'} <Icon name="arrow" size={15}/> {item.current||'Not measured yet'}</b></div><label>Update latest measurement<input aria-label={`Latest measurement for ${item.title}`} type="number" min="0" step="any" value={item.current} onChange={e=>save({...data,entries:data.entries.map(v=>v.id===item.id?{...v,current:e.target.value}:v)})}/></label>{item.notes&&<p>{item.notes}</p>}</article>)}</div>}</>}
    </div><div className="st-save-status" role="status">{message || 'Your checklist and change log stay on this device. Export a copy to keep a backup.'}</div>
  </div>;
}
export default function SeoPage() {
  const value=new URLSearchParams(window.location.search).get('tab');
  const initialTab:Category=value==='off-page'||value==='monitor'?value:'on-page';
  return <SiteShell title="SEO planning preview" description="Organize on-page SEO, local citations, and a manual log of changes and measurements." noIndex path="/seo"><div className="st-container"><div className="st-page-intro"><span className="st-eyebrow">MANUAL SEO PLANNING PREVIEW</span><h1>Make the change.<br /><em>Keep the perspective.</em></h1><p>Bring your website, local reputation, and measurements into a practical weekly routine. These tools save in this browser and do not run automatic audits.</p></div><div className="st-seo-page"><SeoPlanner initialTab={initialTab}/></div></div></SiteShell>;
}
