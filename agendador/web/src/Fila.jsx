import { useCallback, useEffect, useState } from 'react';
import { fmtDate, PLATFORMS, STATUS, supabase } from './lib.js';

const Chip = ({ s }) => {
  const [label, kind] = STATUS[s] || [s, 'muted'];
  return <span className={`chip ${kind}`}>{label}</span>;
};

export default function Fila({ notify }) {
  const [posts, setPosts] = useState(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, post_targets(*, accounts(platform, name))')
      .order('scheduled_at', { ascending: false })
      .limit(50);
    if (error) notify(error.message, true);
    setPosts(data || []);
  }, [notify]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, [load]);

  async function cancel(post) {
    if (!confirm('Cancelar as publicações pendentes deste vídeo?')) return;
    await supabase.from('post_targets').update({ status: 'canceled' }).eq('post_id', post.id).eq('status', 'pending');
    const rest = post.post_targets.filter((t) => t.status !== 'pending');
    if (!rest.length) {
      await supabase.from('posts').update({ status: 'canceled' }).eq('id', post.id);
      await supabase.storage.from('videos').remove([post.video_path]);
    }
    notify('Cancelado.');
    load();
  }

  async function retry(target, post) {
    await supabase.from('post_targets').update({
      status: 'pending', attempts: 0, error: null, remote_state: null,
      next_attempt_at: null, locked_until: null, processing_since: null,
    }).eq('id', target.id);
    await supabase.from('posts').update({ status: 'publishing' }).eq('id', post.id);
    notify('Nova tentativa na próxima rodada (até 1 min).');
    load();
  }

  async function remove(post) {
    if (!confirm('Apagar este item da fila? (não apaga o que já foi publicado nas redes)')) return;
    await supabase.storage.from('videos').remove([post.video_path]);
    await supabase.from('posts').delete().eq('id', post.id);
    load();
  }

  if (posts === null) return <div className="card empty">Carregando…</div>;
  if (!posts.length) return <div className="card empty">Nada agendado ainda.</div>;

  return posts.map((post) => {
    const hasPending = post.post_targets.some((t) => t.status === 'pending');
    const done = ['published', 'failed', 'partial', 'canceled'].includes(post.status);
    return (
      <div key={post.id} className="card">
        <div className="row-between">
          <div>
            <h3>{post.title || (post.caption || 'Sem legenda').split('\n')[0].slice(0, 70)}</h3>
            <div className="muted">{fmtDate(post.scheduled_at)}</div>
          </div>
          <Chip s={post.status} />
        </div>
        <ul className="targets">
          {post.post_targets.map((t) => {
            const p = PLATFORMS[t.accounts?.platform] || { label: '?', color: '#777' };
            return (
              <li key={t.id}>
                <span className="dot" style={{ background: p.color }} />
                <b>{p.label}</b> <span className="muted">{t.accounts?.name}</span> <Chip s={t.status} />
                {t.published_url && <a href={t.published_url} target="_blank" rel="noreferrer">ver post</a>}
                {t.status === 'failed' && <button className="link" onClick={() => retry(t, post)}>tentar de novo</button>}
                {t.error && <div className="error">{t.error}</div>}
              </li>
            );
          })}
        </ul>
        <div className="actions">
          {hasPending && <button className="btn" onClick={() => cancel(post)}>Cancelar</button>}
          {done && <button className="btn del" onClick={() => remove(post)}>Apagar da fila</button>}
        </div>
      </div>
    );
  });
}
