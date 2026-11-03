import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, SUPABASE_URL } from './lib.js';
import Login from './Login.jsx';
import Agendar from './Agendar.jsx';
import Fila from './Fila.jsx';
import Contas from './Contas.jsx';

const TABS = [
  ['agendar', 'Agendar'],
  ['fila', 'Fila'],
  ['contas', 'Contas'],
];

export default function App() {
  const [session, setSession] = useState(undefined);
  const [tab, setTab] = useState(() => location.hash.slice(1) || 'agendar');
  const [toast, setToast] = useState(null);
  const timer = useRef();

  // Estável entre renderizações para não reiniciar o recarregamento da Fila
  const notify = useCallback((msg, error = false) => {
    setToast({ msg, error });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), error ? 7000 : 3500);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Retorno do login das redes (?ok=... ou ?erro=...)
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get('ok')) notify(`Conectado: ${q.get('n') || 1} conta(s).`);
    if (q.get('erro')) notify(q.get('erro'), true);
    if (q.toString()) history.replaceState(null, '', location.pathname + location.hash);
  }, [notify]);

  useEffect(() => { location.hash = tab; }, [tab]);

  if (!SUPABASE_URL) return <div className="wrap"><div className="card">Configure o arquivo <code>.env</code> (veja <code>.env.example</code>).</div></div>;
  if (session === undefined) return null;

  return (
    <>
      <header className="top">
        <div className="wrap row-between">
          <div>
            <small className="kicker">Segurança 2.0</small>
            <h1>Agendador de Vídeos</h1>
          </div>
          {session && <button className="btn ghost" onClick={() => supabase.auth.signOut()}>Sair</button>}
        </div>
      </header>
      <main className="wrap">
        {!session ? <Login notify={notify} /> : (
          <>
            <nav className="tabs">
              {TABS.map(([id, label]) => (
                <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{label}</button>
              ))}
            </nav>
            {tab === 'agendar' && <Agendar notify={notify} goTo={setTab} />}
            {tab === 'fila' && <Fila notify={notify} />}
            {tab === 'contas' && <Contas notify={notify} />}
          </>
        )}
      </main>
      {toast && <div className={`toast ${toast.error ? 'err' : ''}`}>{toast.msg}</div>}
    </>
  );
}
