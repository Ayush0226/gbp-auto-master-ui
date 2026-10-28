import SiteShell from './SiteShell';
import Icon from './Icon';

export default function NotFoundPage() {
  return <SiteShell title="Page not found" description="The requested GBP Auto Master page could not be found." noIndex>
    <div className="st-container st-not-found"><span className="st-eyebrow">404 · A SMALL DETOUR</span><h1>This page has<br/><em>moved on.</em></h1><p>Return home or explore the sample workspace.</p><div><a className="st-button st-button-green" href="/">Return home <Icon name="arrow" size={16}/></a><a className="st-button st-button-outline" href="/workspace">Explore the workspace</a></div></div>
  </SiteShell>;
}
