import { useState } from 'react';
import { supabase } from './lib.js';

export default function Login({ notify }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) notify('E-mail ou senha inválidos.', true);
  }

  return (
    <form className="card narrow" onSubmit={submit}>
      <h2>Entrar</h2>
      <label>E-mail</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      <label>Senha</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
      <button className="btn pri full" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
    </form>
  );
}
