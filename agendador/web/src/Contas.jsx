import { useEffect, useState } from 'react';
import { fmtDate, PLATFORMS, PROVIDERS, supabase } from './lib.js';

export default function Contas({ notify }) {
  const [accounts, setAccounts] = useState([]);
  const [busy, setBusy] = useState(null);

  const load = () => supabase.from('accounts').select('*').order('platform').then(({ data }) => setAccounts(data || []));
  useEffect(() => { load(); }, []);

  async function connect(provider) {
    setBusy(provider);
    const { data, error } = await supabase.functions.invoke('agendador/oauth-start', { body: { provider } });
    if (error || !data?.url) {
      setBusy(null);
      return notify(data?.error || error?.message || 'Não foi possível iniciar a conexão.', true);
    }
    location.href = data.url;
  }

  async function remove(a) {
    if (!confirm(`Desconectar ${PLATFORMS[a.platform].label} — ${a.name}? Os agendamentos pendentes desta conta serão apagados.`)) return;
    await supabase.from('accounts').delete().eq('id', a.id);
    load();
  }

  const soon = (d) => d && new Date(d) - Date.now() < 7 * 864e5;

  return (
    <>
      <div className="card">
        <h2>Conectar redes</h2>
        <p className="muted">Você entra na própria rede e autoriza o app. Sua senha nunca passa por aqui.</p>
        <div className="providers">
          {PROVIDERS.map((p) => (
            <button key={p.id} className="btn prov" disabled={!!busy} onClick={() => connect(p.id)}>
              <b>{busy === p.id ? 'Abrindo…' : p.label}</b>
              <small>{p.note}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Contas conectadas</h2>
        {!accounts.length && <div className="empty">Nenhuma ainda.</div>}
        {accounts.map((a) => {
          const p = PLATFORMS[a.platform];
          return (
            <div key={a.id} className="acc row-between">
              <div className="row">
                {a.avatar_url ? <img className="avatar" src={a.avatar_url} alt="" /> : <span className="avatar" style={{ background: p.color }} />}
                <div>
                  <b>{p.label}</b> <span className="muted">{a.name}</span>
                  <div>
                    {a.status === 'ok' ? <span className="chip ok">Conectada</span> : <span className="chip err">Reconectar</span>}
                    {a.reconnect_by && (
                      <span className={`muted small ${soon(a.reconnect_by) ? 'warn-text' : ''}`}> · vence em {fmtDate(a.reconnect_by)}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="actions tight">
                {(a.status !== 'ok' || soon(a.reconnect_by)) && (
                  <button className="btn pri" onClick={() => connect(p.provider)}>Reconectar</button>
                )}
                <button className="btn del" onClick={() => remove(a)}>Remover</button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
