import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

type OAuthGrant = {
  client: {
    id: string;
    name: string;
    uri: string;
  };
  scopes: string[];
  granted_at: string;
};

export default function ConnectedApps({ showToast }: {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const [grants, setGrants] = useState<OAuthGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadGrants() {
      const { data, error } = await supabase.auth.oauth.listGrants();
      if (!active) return;
      if (error) {
        setLoadError('Could not load connected AI apps. Check that OAuth 2.1 is enabled.');
        setGrants([]);
      } else {
        setGrants(data || []);
      }
      setLoading(false);
    }
    void loadGrants();
    return () => {
      active = false;
    };
  }, []);

  const disconnect = async (grant: OAuthGrant) => {
    const confirmed = window.confirm(
      `Disconnect ${grant.client.name}? Its active GBP Master sessions and refresh tokens will be revoked.`,
    );
    if (!confirmed) return;

    setRevoking(grant.client.id);
    const { error } = await supabase.auth.oauth.revokeGrant({ clientId: grant.client.id });
    if (error) {
      showToast(error.message || 'Could not disconnect this AI app.', 'error');
    } else {
      setGrants((current) => current.filter((item) => item.client.id !== grant.client.id));
      showToast(`${grant.client.name} disconnected.`, 'success');
    }
    setRevoking(null);
  };

  return (
    <section className="page active">
      <div className="page-head">
        <h2>Connected AI Apps</h2>
        <p>Review and disconnect AI applications that can use GBP Master on your behalf.</p>
      </div>

      <div className="card glass" style={{ padding: '22px' }}>
        {loading ? (
          <p>Loading connected apps…</p>
        ) : loadError ? (
          <p style={{ color: 'var(--red-soft, #f87171)', margin: 0 }}>{loadError}</p>
        ) : grants.length === 0 ? (
          <div>
            <h3 style={{ marginTop: 0 }}>No AI apps connected</h3>
            <p style={{ color: 'rgba(255,255,255,.62)', marginBottom: 0 }}>
              Connections you approve through the GBP Master consent screen will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {grants.map((grant) => (
              <article
                key={grant.client.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '18px',
                  alignItems: 'center',
                  padding: '16px',
                  border: '1px solid rgba(255,255,255,.09)',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,.025)',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 6px' }}>{grant.client.name}</h3>
                  <p style={{ margin: '0 0 5px', color: 'rgba(255,255,255,.6)', fontSize: '13px' }}>
                    Connected {new Date(grant.granted_at).toLocaleString()}
                  </p>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,.48)', fontSize: '12px' }}>
                    Account scopes: {grant.scopes.join(', ') || 'email'}
                  </p>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  type="button"
                  disabled={revoking === grant.client.id}
                  onClick={() => void disconnect(grant)}
                  style={{ color: 'var(--red-soft, #f87171)' }}
                >
                  {revoking === grant.client.id ? 'Disconnecting…' : 'Disconnect'}
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
