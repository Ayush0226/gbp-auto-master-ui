const tools = [
  ['⭐', 'Reviews', 'Find unanswered reviews, draft replies, publish approved replies, and manage AI reply automation.'],
  ['📅', 'Content', 'Create campaigns, reuse photos, schedule Google posts, and manage multiple business locations.'],
  ['📍', 'Local rank', 'Measure one keyword in the first 11 Google local results and download the signed PDF report.'],
  ['💳', 'Shared credits', 'See one account balance across every connected Google Business Profile location.'],
];

const userSteps = [
  ['1', 'Install GBP Master', 'Find GBP Master in the ChatGPT and Codex plugin directory and select Install.'],
  ['2', 'Sign in securely', 'Sign in to GBP Auto Master and approve the requested connection. Your Google password is never shared with the AI agent.'],
  ['3', 'Choose a business', 'Ask the agent to list your connected accounts and locations, then select the business you want to manage.'],
  ['4', 'Ask in normal language', 'For example: “Show unanswered reviews” or “Check my rank for coffee shop and give me the PDF.”'],
  ['5', 'Confirm paid actions', 'The agent shows the exact action, target and credit charge before publishing, scheduling, or running a rank scan.'],
  ['6', 'Receive the result', 'See the result in chat. Rank scans include a temporary downloadable PDF link.'],
];

const publisherSteps = [
  ['1', 'Verify the publisher', 'Complete individual or business verification in the OpenAI Platform organization that will own the plugin.'],
  ['2', 'Upload the plugin', 'Open the plugin submission portal, choose “With MCP,” and upload the GBP Master ZIP package.'],
  ['3', 'Verify the domain', 'Add the exact challenge token from OpenAI to the Render OPENAI_APPS_CHALLENGE environment variable, redeploy, and verify.'],
  ['4', 'Connect and scan MCP', 'Connect the production MCP endpoint, complete OAuth, run the tool scan, and resolve every required finding.'],
  ['5', 'Provide review materials', 'Supply a dedicated test account, five positive cases, three negative cases, release notes, and an accessible demo video.'],
  ['6', 'Submit and publish', 'Submit for review. When approved, return to the portal and select Publish to appear in the universal directory.'],
];

function Flow({ items }: { items: string[][] }) {
  return <div style={{ display: 'grid', gap: 14 }}>
    {items.map(([number, title, text], index) => <div key={number} style={{ display: 'grid', gridTemplateColumns: '58px 1fr', gap: 16, alignItems: 'stretch' }}>
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: 16, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 20, color: '#07111f', background: 'linear-gradient(135deg,#68e4ff,#7cffb2)', boxShadow: '0 10px 30px rgba(76,220,255,.22)', zIndex: 1 }}>{number}</div>
        {index < items.length - 1 && <div style={{ position: 'absolute', top: 48, bottom: -14, width: 2, background: 'linear-gradient(#68e4ff55,#7cffb222)' }} />}
      </div>
      <div className="card glass" style={{ padding: '18px 20px', marginBottom: 0 }}><h3 style={{ margin: '0 0 6px' }}>{title}</h3><p style={{ margin: 0, color: 'rgba(255,255,255,.68)', lineHeight: 1.65 }}>{text}</p></div>
    </div>)}
  </div>;
}

export default function PluginGuide() {
  return <div className="app-shell" style={{ overflowY: 'auto', minHeight: '100vh' }}>
    <header className="home-topbar" style={{ position: 'relative', top: 0 }}>
      <a href="/" className="home-logo" style={{ textDecoration: 'none' }}>GBP Auto <span className="grad-blue">Master</span></a>
      <nav><a href="/" className="home-btn-secondary home-glass">← Home</a></nav>
    </header>

    <main style={{ maxWidth: 1120, margin: '0 auto', padding: '64px 22px 90px' }}>
      <section style={{ textAlign: 'center', maxWidth: 850, margin: '0 auto 62px' }}>
        <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center', border: '1px solid rgba(104,228,255,.25)', borderRadius: 999, padding: '7px 13px', color: '#9feeff', background: 'rgba(104,228,255,.07)', fontSize: 13 }}>🤖 Works with ChatGPT and Codex</div>
        <h1 className="home-grad-metal" style={{ fontSize: 'clamp(38px,7vw,72px)', margin: '20px 0 18px', lineHeight: 1.04 }}>Manage Google Business Profile from a conversation</h1>
        <p style={{ fontSize: 19, lineHeight: 1.7, color: 'rgba(255,255,255,.7)' }}>GBP Master connects an AI agent to your GBP Auto Master account through a secure hosted MCP server. Ask for reviews, scheduled posts, media, automation, account information, or a measured local rank report without moving between dashboards.</p>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 16, marginBottom: 72 }}>
        {tools.map(([icon, title, text]) => <article className="card glass glass-hover" key={title} style={{ padding: 22 }}><div style={{ fontSize: 34 }}>{icon}</div><h2 style={{ fontSize: 19, margin: '13px 0 8px' }}>{title}</h2><p style={{ color: 'rgba(255,255,255,.65)', lineHeight: 1.6, margin: 0 }}>{text}</p></article>)}
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))', gap: 22, marginBottom: 76 }}>
        <div className="card glass" style={{ padding: 26, textAlign: 'center' }}><div style={{ fontSize: 50 }}>💬</div><h2>ChatGPT or Codex</h2><p style={{ color: 'rgba(255,255,255,.65)' }}>Understands the request, selects the correct GBP Master tool, and asks for confirmation before a chargeable action.</p></div>
        <div className="card glass" style={{ padding: 26, textAlign: 'center' }}><div style={{ fontSize: 50 }}>🔐</div><h2>GBP Master MCP</h2><p style={{ color: 'rgba(255,255,255,.65)' }}>Verifies OAuth identity, checks ownership, protects credentials, applies credit rules, and calls the requested service.</p></div>
        <div className="card glass" style={{ padding: 26, textAlign: 'center' }}><div style={{ fontSize: 50 }}>🏪</div><h2>Google Business Profile</h2><p style={{ color: 'rgba(255,255,255,.65)' }}>Returns business data or receives an approved reply or post. SerpApi supplies measured local rank results.</p></div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 40, marginBottom: 76 }}>
        <div><p style={{ color: '#87eaff', fontWeight: 800, letterSpacing: 1 }}>FOR USERS</p><h2 style={{ fontSize: 34 }}>How it works</h2><Flow items={userSteps} /></div>
        <div><p style={{ color: '#8affbd', fontWeight: 800, letterSpacing: 1 }}>FOR THE PUBLISHER</p><h2 style={{ fontSize: 34 }}>How to publish it</h2><Flow items={publisherSteps} /></div>
      </section>

      <section className="card glass" style={{ padding: 30, marginBottom: 30 }}>
        <h2 style={{ fontSize: 30, marginTop: 0 }}>Cost and timing</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 18 }}>
          <div><h3>OpenAI submission</h3><p style={{ color: 'rgba(255,255,255,.68)', lineHeight: 1.65 }}>OpenAI’s public documentation does not list a plugin-submission fee. The publishing portal will show any account-specific requirement before you submit.</p></div>
          <div><h3>Operating costs</h3><p style={{ color: 'rgba(255,255,255,.68)', lineHeight: 1.65 }}>You remain responsible for your domain, Render hosting, Supabase, SerpApi searches, Groq usage, and any paid Google or third-party services.</p></div>
          <div><h3>Preparation time</h3><p style={{ color: 'rgba(255,255,255,.68)', lineHeight: 1.65 }}>Allow roughly one to two focused days to prepare the reviewer account, demo video, domain challenge, connection and test run when scans pass.</p></div>
          <div><h3>OpenAI review time</h3><p style={{ color: 'rgba(255,255,255,.68)', lineHeight: 1.65 }}>OpenAI provides no fixed review duration. Timing varies, and corrections or resubmission can extend the process.</p></div>
        </div>
      </section>

      <section className="card glass" style={{ padding: 30 }}>
        <h2 style={{ marginTop: 0 }}>Safety and billing</h2>
        <ul style={{ lineHeight: 1.9, color: 'rgba(255,255,255,.72)', paddingLeft: 22 }}>
          <li>OAuth determines the signed-in user; agents never request Google or Supabase tokens.</li>
          <li>Read operations and reply drafts are free.</li>
          <li>Public replies cost 2.5 credits, scheduled posts cost 5 credits per location, and a local rank scan costs 10 credits.</li>
          <li>The agent displays the content, target and charge before publishing, scheduling or scanning.</li>
          <li>A successful rank scan includes a signed PDF link that expires after one hour, with no extra PDF charge.</li>
        </ul>
        <p style={{ marginBottom: 0 }}><a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms</a> · <a href="/support">Support</a> · <a href="https://developers.openai.com/plugins/deploy/submission" target="_blank" rel="noreferrer">Official OpenAI submission guide</a></p>
      </section>
    </main>
  </div>;
}
