import { useEffect, useState } from 'react';
import { FORMATS, MAX_MB, PLATFORMS, supabase, toLocalInput, uploadWithProgress } from './lib.js';

/** Formatos que o vídeo não atende pela duração (ex.: Stories > 60 s). */
function durationProblem(fmt, sec) {
  if (!sec) return null;
  if (fmt.maxSec && sec > fmt.maxSec) return `máx. ${fmt.maxSec} s`;
  if (fmt.minSec && sec < fmt.minSec) return `mín. ${fmt.minSec} s`;
  return null;
}

/** Lê a duração do vídeo sem tocá-lo. */
function readDuration(url) {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => resolve(Number.isFinite(v.duration) ? v.duration : null);
    v.onerror = () => resolve(null);
    v.src = url;
  });
}

const INTERVALS = [
  { h: 1, label: 'a cada 1 hora' },
  { h: 3, label: 'a cada 3 horas' },
  { h: 6, label: 'a cada 6 horas' },
  { h: 12, label: 'a cada 12 horas' },
  { h: 24, label: '1 por dia' },
  { h: 48, label: 'a cada 2 dias' },
  { h: 72, label: 'a cada 3 dias' },
  { h: 168, label: '1 por semana' },
];

const addHours = (local, h) => toLocalInput(new Date(new Date(local).getTime() + h * 3600_000));

export default function Agendar({ notify, goTo }) {
  const [accounts, setAccounts] = useState([]);
  const [videos, setVideos] = useState([]);           // { id, file, url, duration, title, caption, when }
  const [selected, setSelected] = useState({});       // account_id -> [formatos]
  const [start, setStart] = useState(() => toLocalInput(new Date(Date.now() + 15 * 60_000)));
  const [every, setEvery] = useState(24);
  const [progress, setProgress] = useState(null);     // { i, n, pct }

  useEffect(() => {
    supabase.from('accounts').select('*').order('platform').then(({ data }) => {
      setAccounts(data || []);
      // Por padrão: primeiro formato de cada conta conectada
      setSelected(Object.fromEntries((data || []).filter((a) => a.status === 'ok').map((a) => [a.id, [FORMATS[a.platform][0].id]])));
    });
  }, []);

  // Libera as prévias ao sair da tela
  useEffect(() => () => videos.forEach((v) => URL.revokeObjectURL(v.url)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const single = videos.length === 1;
  const patch = (id, p) => setVideos((vs) => vs.map((v) => (v.id === id ? { ...v, ...p } : v)));

  function spread(list, from = start, h = every) {
    return list.map((v, i) => ({ ...v, when: addHours(from, i * h) }));
  }

  async function pickFiles(fileList) {
    const files = [...(fileList || [])];
    const big = files.filter((f) => f.size > MAX_MB * 1024 * 1024);
    if (big.length) notify(`${big.map((f) => f.name).join(', ')}: maior que ${MAX_MB} MB. Comprima antes de enviar.`, true);
    const ok = files.filter((f) => f.size <= MAX_MB * 1024 * 1024);
    if (!ok.length) return;
    const added = ok.map((file) => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file), duration: null, title: '', caption: '', custom: {} }));
    setVideos((vs) => spread([...vs, ...added]));
    for (const v of added) readDuration(v.url).then((d) => patch(v.id, { duration: d }));
  }

  function remove(id) {
    setVideos((vs) => {
      const gone = vs.find((v) => v.id === id);
      if (gone) URL.revokeObjectURL(gone.url);
      return vs.filter((v) => v.id !== id);
    });
  }

  function move(idx, dir) {
    setVideos((vs) => {
      const j = idx + dir;
      if (j < 0 || j >= vs.length) return vs;
      const next = [...vs];
      [next[idx], next[j]] = [next[j], next[idx]];
      // Os horários ficam no lugar; trocam só os vídeos
      return next.map((v, i) => ({ ...v, when: vs[i].when }));
    });
  }

  function toggle(accountId, formatId, on) {
    const cur = selected[accountId] || [];
    const next = on ? [...new Set([...cur, formatId])] : cur.filter((x) => x !== formatId);
    setSelected({ ...selected, [accountId]: next });
  }

  // Uma publicação por conta + formato (vale para todos os vídeos)
  const targets = accounts.flatMap((a) =>
    (selected[a.id] || []).map((fid) => ({ account: a, fmt: FORMATS[a.platform].find((f) => f.id === fid) })),
  );

  // Contas marcadas em algum formato que leva legenda (Stories não leva)
  const captionAccounts = accounts.filter((a) =>
    (selected[a.id] || []).some((fid) => !FORMATS[a.platform].find((f) => f.id === fid)?.noCaption));

  function validate(now) {
    if (!videos.length) return 'Escolha ao menos um vídeo.';
    if (!targets.length) return 'Marque ao menos um formato em alguma rede.';
    for (const [i, v] of videos.entries()) {
      const name = single ? 'O vídeo' : `Vídeo ${i + 1} (${v.file.name})`;
      if (!now && new Date(v.when) < new Date(Date.now() - 60_000)) return `${name}: a data/hora já passou.`;
      for (const { account: a, fmt } of targets) {
        const problem = durationProblem(fmt, v.duration);
        if (problem) return `${name} tem ${Math.round(v.duration)} s — ${PLATFORMS[a.platform].label} ${fmt.label} aceita ${problem}. Desmarque o formato ou corte o vídeo.`;
        const text = v.custom[a.id] ?? v.caption;
        const lim = PLATFORMS[a.platform].limit;
        if (!fmt.noCaption && text.length > lim) return `${name}: legenda do ${PLATFORMS[a.platform].label} passa de ${lim} caracteres.`;
      }
    }
    return null;
  }

  async function submit(now) {
    const problem = validate(now);
    if (problem) return notify(problem, true);

    const { data: { user } } = await supabase.auth.getUser();
    const queue = [...videos];
    let done = 0;
    try {
      for (const [i, v] of queue.entries()) {
        const ext = (v.file.name.split('.').pop() || 'mp4').toLowerCase();
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        setProgress({ i: i + 1, n: queue.length, pct: 0 });
        await uploadWithProgress(path, v.file, (pct) => setProgress({ i: i + 1, n: queue.length, pct }));

        const { data: post, error } = await supabase.from('posts').insert({
          title: v.title.trim() || null,
          caption: v.caption,
          video_path: path,
          video_size: v.file.size,
          video_type: v.file.type || 'video/mp4',
          scheduled_at: (now ? new Date() : new Date(v.when)).toISOString(),
        }).select().single();
        if (error) throw error;

        const { error: e2 } = await supabase.from('post_targets').insert(
          targets.map(({ account: a, fmt }) => ({ post_id: post.id, account_id: a.id, format: fmt.id, caption: v.custom[a.id] || null })),
        );
        if (e2) throw e2;

        URL.revokeObjectURL(v.url);
        setVideos((vs) => vs.filter((x) => x.id !== v.id));
        done++;
      }
      notify(now
        ? `${done > 1 ? `${done} vídeos enviados` : 'Enviado'} para publicação. Acompanhe na Fila.`
        : (done > 1 ? `${done} vídeos agendados!` : 'Vídeo agendado!'));
      goTo('fila');
    } catch (err) {
      const msg = err.message || 'Erro ao agendar.';
      notify(done ? `${done} agendado(s). Parou no vídeo ${done + 1}: ${msg} Os que faltam continuam na tela.` : msg, true);
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

  const busy = progress !== null;

  return (
    <div className="grid2">
      <div className="card">
        <h2>1. Vídeos {videos.length > 1 && <span className="chip info">{videos.length}</span>}</h2>
        <label className={`drop ${videos.length ? 'drop-small' : ''}`}>
          <input type="file" multiple accept="video/mp4,video/quicktime,video/*" hidden disabled={busy}
            onChange={(e) => { pickFiles(e.target.files); e.target.value = ''; }} />
          <span>
            {videos.length ? '+ Adicionar mais vídeos' : 'Toque para escolher os vídeos'}<br />
            <small>Pode escolher vários de uma vez · MP4 ou MOV · até {MAX_MB} MB cada · vertical 9:16 recomendado</small>
          </span>
        </label>

        {videos.map((v, i) => (
          <div key={v.id} className="vid">
            <div className="vid-head">
              <video src={v.url} preload="metadata" muted playsInline controls />
              <div className="vid-info">
                <b>{single ? 'Vídeo' : `Vídeo ${i + 1}`}</b>
                <div className="muted small">{v.file.name} · {(v.file.size / 1048576).toFixed(1)} MB{v.duration ? ` · ${Math.round(v.duration)} s` : ''}</div>
                {targets.map(({ account: a, fmt }) => {
                  const p = durationProblem(fmt, v.duration);
                  return p ? <div key={a.id + fmt.id} className="error">{PLATFORMS[a.platform].label} {fmt.label}: {p}</div> : null;
                })}
                <div className="actions tight">
                  {!single && <button className="btn ghost small-btn" disabled={busy || i === 0} onClick={() => move(i, -1)} title="Subir">↑</button>}
                  {!single && <button className="btn ghost small-btn" disabled={busy || i === videos.length - 1} onClick={() => move(i, 1)} title="Descer">↓</button>}
                  <button className="btn del small-btn" disabled={busy} onClick={() => remove(v.id)}>Remover</button>
                </div>
              </div>
            </div>

            <label>Título <small>(YouTube, Facebook Feed e LinkedIn)</small></label>
            <input value={v.title} maxLength={100} onChange={(e) => patch(v.id, { title: e.target.value })} placeholder="Ex.: Abordagem em portaria — erro nº 1" />

            <label>Legenda / descrição</label>
            <textarea value={v.caption} onChange={(e) => patch(v.id, { caption: e.target.value })} rows={4} placeholder="Texto que vai em todas as redes marcadas" />
            <div className="muted right small">{v.caption.length} caracteres · Stories não levam legenda</div>

            {captionAccounts.length > 0 && (
              <details className="per-net" open={Object.keys(v.custom).length > 0}>
                <summary className="muted">Legenda diferente por rede {Object.keys(v.custom).length > 0 && <span className="chip info">{Object.keys(v.custom).length}</span>}</summary>
                {captionAccounts.map((a) => {
                  const p = PLATFORMS[a.platform];
                  const text = v.custom[a.id] ?? v.caption;
                  return (
                    <div key={a.id}>
                      <label>
                        <span className="dot" style={{ background: p.color }} />{p.label} <small>{a.name}</small>
                        {text.length > p.limit && <span className="chip err">{text.length}/{p.limit}</span>}
                      </label>
                      <textarea rows={3} value={v.custom[a.id] ?? ''} placeholder="Vazio = usa a legenda acima"
                        onChange={(e) => {
                          const val = e.target.value;
                          const next = { ...v.custom };
                          if (val) next[a.id] = val; else delete next[a.id];
                          patch(v.id, { custom: next });
                        }} />
                    </div>
                  );
                })}
              </details>
            )}

            {!single && (
              <>
                <label>Data e hora deste vídeo</label>
                <input type="datetime-local" value={v.when} onChange={(e) => patch(v.id, { when: e.target.value })} />
              </>
            )}
          </div>
        ))}
      </div>

      <div className="card">
        <h2>2. Onde e em qual formato</h2>
        {videos.length > 1 && <p className="muted small">Vale para todos os vídeos.</p>}
        {accounts.map((a) => {
          const p = PLATFORMS[a.platform];
          const fmts = FORMATS[a.platform];
          const chosen = selected[a.id] || [];
          return (
            <div key={a.id} className={`acc ${a.status !== 'ok' ? 'off' : ''}`}>
              <div className="acc-head">
                <span className="dot" style={{ background: p.color }} />
                <b>{p.label}</b> <span className="muted">{a.name}</span>
                {a.status !== 'ok' && <span className="chip err">reconectar</span>}
              </div>
              <div className="formats">
                {fmts.map((f) => {
                  const bad = videos.some((v) => durationProblem(f, v.duration));
                  return (
                    <label key={f.id} className={`fmt ${chosen.includes(f.id) ? 'on' : ''} ${bad ? 'bad' : ''}`} title={f.hint || ''}>
                      <input type="checkbox" disabled={a.status !== 'ok'} checked={chosen.includes(f.id)}
                        onChange={(e) => toggle(a.id, f.id, e.target.checked)} />
                      {f.label}{bad && <small> · {single ? durationProblem(f, videos[0].duration) : 'duração'}</small>}
                    </label>
                  );
                })}
              </div>
              {fmts[0].hint && <div className="muted small">{fmts[0].hint}</div>}
            </div>
          );
        })}

        <h2 style={{ marginTop: 20 }}>3. Quando</h2>
        {videos.length > 1 ? (
          <>
            <label>Primeiro vídeo em</label>
            <input type="datetime-local" value={start} onChange={(e) => { setStart(e.target.value); setVideos((vs) => spread(vs, e.target.value)); }} />
            <label>Depois</label>
            <select value={every} onChange={(e) => { const h = Number(e.target.value); setEvery(h); setVideos((vs) => spread(vs, start, h)); }}>
              {INTERVALS.map((x) => <option key={x.h} value={x.h}>{x.label}</option>)}
            </select>
            <p className="muted small">Os horários de cada vídeo aparecem no cartão dele e podem ser ajustados um a um.</p>
          </>
        ) : (
          <input type="datetime-local" value={videos[0]?.when ?? start}
            onChange={(e) => { setStart(e.target.value); if (videos[0]) patch(videos[0].id, { when: e.target.value }); }} />
        )}

        {busy ? (
          <div className="progress">
            <div style={{ width: `${progress.pct}%` }} />
            <span>Enviando {progress.n > 1 ? `vídeo ${progress.i} de ${progress.n}` : 'vídeo'}… {progress.pct}%</span>
          </div>
        ) : (
          <div className="actions">
            <button className="btn pri" onClick={() => submit(false)}>
              {videos.length > 1 ? `Agendar ${videos.length} vídeos` : 'Agendar'} ({targets.length * Math.max(videos.length, 1)})
            </button>
            <button className="btn" onClick={() => submit(true)}>{videos.length > 1 ? 'Publicar todos agora' : 'Publicar agora'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
