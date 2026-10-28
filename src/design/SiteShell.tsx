import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Icon from './Icon';
import { analyticsConsent, setAnalyticsConsent, trackEvent } from './analytics';
import './studio.css';

export function Brand({ light = false }: { light?: boolean }) {
  return <a className={`st-brand ${light ? 'is-light' : ''}`} href="/" aria-label="GBP Auto Master home"><span className="st-brand-mark"><Icon name="spark" size={25} /></span><span>gbp<span className="st-brand-word">automaster</span></span></a>;
}
export function ConnectButton({ label = 'Start with 200 free credits', className = '' }: { label?: string; className?: string }) {
  return <span className="st-connect"><a onClick={()=>trackEvent('signup_cta_clicked',{label})} href="/signup" className={`st-button st-button-green ${className}`}>{label}<Icon name="arrowUp" size={17} /></a></span>;
}

export function usePageMeta(title: string, description: string, options: { noIndex?: boolean; path?: string } = {}) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} | GBP Auto Master`;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.append(meta); }
    const oldDescription = meta.content; meta.content = description;
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.append(robots); }
    const oldRobots = robots.content; robots.content = options.noIndex ? 'noindex,nofollow' : 'index,follow';
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical); }
    const oldCanonical = canonical.href;
    canonical.href = `https://gbpautomaster.in${options.path || window.location.pathname}`;
    trackEvent('page_view', { title, path: window.location.pathname });
    return () => { document.title = previous; if (meta) meta.content = oldDescription; if (robots) robots.content = oldRobots; if (canonical) canonical.href = oldCanonical; };
  }, [title, description, options.noIndex, options.path]);
}

export default function SiteShell({ children, title = 'Google Business Profile management', description = 'Manage Google Business Profile reviews, scheduled content and local rank reports in one connected workspace.', noIndex = false, path }: { children: ReactNode; title?: string; description?: string; noIndex?: boolean; path?: string }) {
  const [menu, setMenu] = useState(false);
  const [consent, setConsent] = useState<string | null>(()=>analyticsConsent());
  const menuButton = useRef<HTMLButtonElement>(null);
  usePageMeta(title, description, { noIndex, path });
  useEffect(() => {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('st-seen'); observer.unobserve(entry.target); }
    }), { threshold: 0.07 });
    document.querySelectorAll('[data-reveal]').forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, []);
  useEffect(()=>{
    if(!menu) return;
    const close=(event:KeyboardEvent)=>{if(event.key==='Escape'){setMenu(false);menuButton.current?.focus();}};
    window.addEventListener('keydown',close); return()=>window.removeEventListener('keydown',close);
  },[menu]);
  return <div className="st-site">
    <a href="#main-content" className="st-skip">Skip to content</a>
    <header className="st-header"><div className="st-container st-header-inner"><Brand />
      <nav className={`st-nav ${menu ? 'is-open' : ''}`} aria-label="Main navigation">
        <a href="/#platform" onClick={() => setMenu(false)}>Platform</a><a href="/#security" onClick={() => setMenu(false)}>Security</a><a href="/plugin">AI connection <span className="st-nav-dot" /></a><a href="/#pricing" onClick={() => setMenu(false)}>Pricing</a>
      </nav><div className="st-nav-actions"><a className="st-login" href="/dashboard-v2">Log in</a><ConnectButton label="Start free" /><button ref={menuButton} className="st-menu" onClick={() => setMenu(!menu)} aria-label={menu ? 'Close navigation' : 'Open navigation'} aria-expanded={menu}><Icon name={menu ? 'close' : 'menu'} /></button></div>
    </div></header>
    <main id="main-content">{children}</main>
    <footer className="st-footer"><div className="st-container"><div className="st-footer-top"><div><Brand /><p>Good businesses deserve<br />to be found.</p></div><div><span>PLATFORM</span><a href="/#platform">Reviews & content</a><a href="/workspace?view=seo">SEO planning preview</a><a href="/plugin">AI connection</a><a href="/workspace">Explore the workspace</a></div><div><span>RESOURCES</span><a href="/#pricing">Plans & credits</a><a href="/support">Help & support</a><a href="/privacy">Privacy</a><a href="/terms">Terms of service</a></div><div className="st-footer-note"><span>BUILT FOR YOUR EVERYDAY</span><p>One business or many.<br />A little less admin.<br />A lot more room to grow.</p><Icon name="leaf" size={30} /></div></div><div className="st-footer-bottom"><span>© {new Date().getFullYear()} GBP Auto Master</span><span>Independent software. Not affiliated with Google or OpenAI.</span><a href="/refund">Refund policy <Icon name="arrowUp" size={12} /></a></div></div></footer>
    {!consent&&<aside className="st-consent" aria-label="Analytics preference"><div><b>Your privacy, clearly handled.</b><span>Essential storage keeps the site working. Optional anonymous measurements help us improve signup; they stay off unless you allow them.</span></div><div><button onClick={()=>{setAnalyticsConsent('essential');setConsent('essential');}}>Essential only</button><button className="st-button st-button-green" onClick={()=>{setAnalyticsConsent('allowed');setConsent('allowed');trackEvent('analytics_allowed');}}>Allow anonymous analytics</button></div></aside>}
  </div>;
}
