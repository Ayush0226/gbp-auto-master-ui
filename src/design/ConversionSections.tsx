import { useState } from 'react';
import Icon from './Icon';

export function GuidedDemo() {
  const [step, setStep] = useState(0);
  const demos = [
    { label: 'Review', title: 'A new five-star review arrives', body: 'GBP Auto Master creates a draft in your preferred length and tone. Nothing is published in approval mode until you confirm it.', action: 'Approve sample reply' },
    { label: 'Content', title: 'Turn an idea into a scheduled update', body: 'Choose locations, add an offer or update, attach media, and review every target before scheduling.', action: 'Preview sample post' },
    { label: 'Rank', title: 'Measure one local keyword', body: 'Run a top-11 scan for an area and download the measured results as a PDF. Rankings are a snapshot, not a promise.', action: 'Preview rank report' },
  ];
  const active = demos[step];
  return <section className="st-section st-container st-guided" aria-labelledby="guided-title" data-reveal>
    <div className="st-section-heading"><div><span className="st-eyebrow">SEE THE WORKFLOW</span><h2 id="guided-title">Try it with sample data.<br/><em>Connect later.</em></h2></div><p>A guided product tour lets you understand each workflow before granting Google access.</p></div>
    <div className="st-guided-grid"><div className="st-demo-steps" role="tablist" aria-label="Product tour steps">{demos.map((item,index)=><button key={item.label} role="tab" aria-selected={step===index} onClick={()=>setStep(index)}><span>0{index+1}</span><b>{item.label}</b><small>{item.title}</small></button>)}</div><div className="st-demo-stage" role="tabpanel"><span className="st-status st-status-sample">Sample preview</span><Icon name={step===0?'message':step===1?'calendar':'chart'} size={30}/><h3>{active.title}</h3><p>{active.body}</p><button onClick={()=>setStep((step+1)%demos.length)} className="st-button st-button-outline">{active.action}<Icon name="arrow" size={16}/></button><small>No Google data is read or changed in this preview.</small></div></div>
  </section>;
}

export function TrustSection() {
  return <section className="st-trust-section" id="security"><div className="st-container"><div className="st-section-heading"><div><span className="st-eyebrow">SECURITY & CONTROL</span><h2>Your account.<br/><em>Your final say.</em></h2></div><p>Create your GBP Auto Master account first. Connect Google only when you are ready to use live locations.</p></div><div className="st-trust-grid">{[
    ['shield','No Google password','Google handles authorization. GBP Auto Master never asks for or stores your Google password.'],
    ['check','Clear permissions','The connection screen shows the Google Business Profile access requested before you approve it.'],
    ['message','Approval controls','Keep replies in an approval queue, or deliberately enable automation with rules you choose.'],
    ['link','Disconnect and delete','Revoke Google access from your Google Account. Request account and stored-data deletion from the privacy page.'],
  ].map(([icon,title,body])=><article key={title}><Icon name={icon as 'shield'} size={22}/><h3>{title}</h3><p>{body}</p></article>)}</div><div className="st-trust-actions"><a href="/privacy">Read the privacy policy <Icon name="arrow" size={14}/></a><a href="/support">Get account help <Icon name="arrow" size={14}/></a></div></div></section>;
}
