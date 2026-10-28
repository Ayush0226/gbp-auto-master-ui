import { useState } from 'react';
import { apiFetch } from './lib/api';
import { GoogleBusinessConnectButton } from './design/AuthPage';
import SiteShell from './design/SiteShell';
import Icon from './design/Icon';
import './Onboarding.css';

export default function Onboarding() {
  const [step,setStep]=useState(()=>sessionStorage.getItem('gbp_connection_started')?'2':'1');
  const [replyLength,setReplyLength]=useState('10-40');
  const [keywordInput,setKeywordInput]=useState('');
  const [keywords,setKeywords]=useState<string[]>([]);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const addKeyword=(event:React.KeyboardEvent<HTMLInputElement>)=>{if(event.key==='Enter'&&keywordInput.trim()&&keywords.length<2){event.preventDefault();setKeywords([...keywords,keywordInput.trim()]);setKeywordInput('');}};
  const save=async()=>{setSaving(true);setError('');try{const response=await apiFetch('/api/user/onboarding',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reply_length:replyLength,seo_keywords:keywords})});if(!response.ok)throw new Error('Could not save your preferences.');setStep('4');}catch(error){setError(error instanceof Error?error.message:'Could not save your preferences.');}finally{setSaving(false);}};
  return <SiteShell title="Set up your workspace" description="Connect Google Business Profile and choose your GBP Auto Master preferences." noIndex path="/onboarding"><div className="onboarding-container"><div className="onboarding-card onboarding-card-v2">
    <div className="onboarding-progress" aria-label={`Step ${step} of 4`}>{[1,2,3,4].map(number=><div key={number} className={`progress-step ${Number(step)>=number?'active':''}`}/>)}</div>
    {step==='1'&&<div className="step-content fade-in"><span className="st-status">Account created</span><h2>Connect your Google Business Profile</h2><p>This separate Google screen asks for permission to read and manage the locations you select. We never receive your Google password.</p><div className="onboarding-permissions"><span><Icon name="check" size={16}/> Read locations and reviews</span><span><Icon name="check" size={16}/> Publish replies and approved content</span><span><Icon name="shield" size={16}/> Revoke access from your Google Account</span></div><GoogleBusinessConnectButton label="Continue to Google"/><a className="secondary-btn" href="/workspace">Explore sample workspace first</a></div>}
    {step==='2'&&<div className="step-content fade-in"><span className="st-status st-status-sample">Preferences</span><h2>Choose your review style</h2><p>AI drafts follow this approximate length. You can edit every draft before approval.</p><div className="radio-group">{['10-40','50-90','100-120'].map(length=><label key={length} className={`radio-option ${replyLength===length?'selected':''}`}><input type="radio" name="replyLength" value={length} checked={replyLength===length} onChange={event=>setReplyLength(event.target.value)}/><span>{length} words</span></label>)}</div><button className="primary-btn" onClick={()=>setStep('3')}>Continue</button></div>}
    {step==='3'&&<div className="step-content fade-in"><span className="st-status st-status-sample">Optional</span><h2>Add up to two local keywords</h2><p>These help organize your workspace. A paid rank scan costs 10 credits and always asks for confirmation.</p><input className="keyword-input" value={keywordInput} onChange={event=>setKeywordInput(event.target.value)} onKeyDown={addKeyword} disabled={keywords.length>=2} placeholder="Type a keyword and press Enter"/><div className="chips-container">{keywords.map((keyword,index)=><span className="chip" key={keyword}>{keyword}<button aria-label={`Remove ${keyword}`} onClick={()=>setKeywords(keywords.filter((_,item)=>item!==index))}>×</button></span>)}</div>{error&&<p className="error-message" role="alert">{error}</p>}<div className="btn-group"><button className="secondary-btn" onClick={()=>setStep('2')}>Back</button><button className="primary-btn" disabled={saving} onClick={save}>{saving?'Saving…':'Save preferences'}</button></div></div>}
    {step==='4'&&<div className="step-content fade-in success-step"><div className="confetti-icon"><Icon name="check" size={34}/></div><h2>Your workspace is ready</h2><p>New accounts receive 200 welcome credits once. Live actions show their credit cost before confirmation.</p><a className="primary-btn" href="/dashboard-v2">Open dashboard</a></div>}
  </div></div></SiteShell>;
}
