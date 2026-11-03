import { useEffect, useMemo, useState } from 'react';
import { MAX_MB, PLATFORMS, supabase, toLocalInput, uploadWithProgress } from './lib.js';

export default function Agendar({ notify, goTo }) {
  const [accounts, setAccounts] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [selected, setSelected] = useState({});      // account_id -> true
  const [custom, setCustom] = useState({});          // account_id -> legenda própria
  const [when, setWhen] = useState(() => toLocalInput(new Date(Date.now() + 15 * 60_000)));
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    supabase.from('accounts').select('*').order('platform').then(({ data }) => {
      setAccounts(data || []);
      setSelected(Object.fromEntries((data || []).filter((a) => a.status === 'ok').map((a) => [a.id, true])));
    });
  }, []);

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  function pickFile(f) {
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) return notify(`Vídeo maior que ${MAX_MB} MB. Comprima antes de enviar.`, true);
    setFile(f);
  }

  const chosen = accounts.filter((a) => selected[a.id]);

  async function submit(now) {
    if (!file) return notify('Escolha o vídeo.', true);
    if (!chosen.length) return notify('Marque ao menos uma rede.', true);
    const scheduledAt = now ? new Date() : new Date(when);
    if (!now && scheduledAt < new Date(Date.now() - 60_000)) return notify('A data/hora já passou.', true);
    for (const a of chosen) {
      const text = custom[a.id] ?? caption;
      const lim = PLATFORMS[a.platform].limit;
      if (text.length > lim) return notify(`Legenda do ${PLATFORMS[a.platform].label} passa de ${lim} caracteres.`, true);
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      setProgress(0);
      await uploadWithProgress(path, file, setProgress);

      const { data: post, error } = await supabase.from('posts').insert({
        title: title.trim() || null,
        caption,
        video_path: path,
        video_size: file.size,
        video_type: file.type || 'video/mp4',
        scheduled_at: scheduledAt.toISOString(),
      }).select().single();
      if (error) throw error;

      const { error: e2 } = await supabase.from('post_targets').insert(
        chosen.map((a) => ({ post_id: post.id, account_id: a.id, caption: custom[a.id] ?? null })),
      );
      if (e2) throw e2;

      notify(now ? 'Enviado para publicação. Acompanhe na Fila.' : 'Vídeo agendado!');
      setFile(null); setTitle(''); setCaption(''); setCustom({});
      goTo('fila');
    } catch (err) {
      notify(err.message || 'Erro ao agendar.', true);
    } finally {
      setProgress(null);
    }
  }

  if (!accounts.length) {
    return (
      <div className="card empty">
        Nenhuma rede conectada ainda.
        <div><button className="btn pri" onClick={() => goTo('contas')}>Conectar redes</button></div>
      </div>
    );
  }

  return (
    <div className="grid2">
      <div className="card">
        <h2>1. Vídeo</h2>
        <label className="drop">
          <input type="file" accept="video/mp4,video/quicktime,video/*" hidden onChange={(e) => pickFile(e.target.files[0])} />
          {preview ? <video src={preview} controls playsInline /> : <span>Toque para escolher o vídeo<br /><small>MP4 ou MOV · até {MAX_MB} MB · vertical 9:16 recomendado</small></span>}
        </label>
        {file && <div className="muted">{file.name} · {(file.size / 1048576).toFixed(1)} MB</div>}

        <label>Título <small>(YouTube e LinkedIn)</small></label>
        <input value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Abordagem em portaria — erro nº 1" />

        <label>Legenda / descrição</label>
        <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={6} placeholder="Texto que vai em todas as redes marcadas" />
        <div className="muted right">{caption.length} caracteres</div>
      </div>

      <div className="card">
        <h2>2. Onde publicar</h2>
        {accounts.map((a) => {
          const p = PLATFORMS[a.platform];
          const text = custom[a.id] ?? caption;
          return (
            <div key={a.id} className={`acc ${a.status !== 'ok' ? 'off' : ''}`}>
              <label className="check">
                <input type="checkbox" disabled={a.status !== 'ok'} checked={!!selected[a.id]}
                  onChange={(e) => setSelected({ ...selected, [a.id]: e.target.checked })} />
                <span className="dot" style={{ background: p.color }} />
                <b>{p.label}</b> <span className="muted">{a.name}</span>
                {a.status !== 'ok' && <span className="chip err">reconectar</span>}
              </label>
              {selected[a.id] && (
                <details>
                  <summary className="muted">Legenda própria para {p.label} {text.length > p.limit && <span className="chip err">{text.length}/{p.limit}</span>}</summary>
                  <textarea rows={4} value={custom[a.id] ?? ''} placeholder="Deixe vazio para usar a legenda geral"
                    onChange={(e) => {
                      const v = e.target.value;
                      const next = { ...custom };
                      if (v) next[a.id] = v; else delete next[a.id];
                      setCustom(next);
                    }} />
                </details>
              )}
            </div>
          );
        })}

        <h2 style={{ marginTop: 20 }}>3. Quando</h2>
        <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />

        {progress !== null ? (
          <div className="progress"><div style={{ width: `${progress}%` }} /><span>Enviando vídeo… {progress}%</span></div>
        ) : (
          <div className="actions">
            <button className="btn pri" onClick={() => submit(false)}>Agendar</button>
            <button className="btn" onClick={() => submit(true)}>Publicar agora</button>
          </div>
        )}
      </div>
    </div>
  );
}
