// Publicador: chamado pelo cron a cada minuto. Processa os alvos vencidos, um de cada vez,
// guardando a etapa de cada rede para continuar na próxima rodada (processamento assíncrono).
import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { admin, ApiError, env, json } from './core.ts';
import { PUBLISHERS, REFRESHERS } from './platforms/index.ts';
import type { Account, Post, Tokens } from './types.ts';

const MAX_ATTEMPTS = 3;
const TIME_BUDGET_MS = 100_000;          // abaixo do limite de execução das Edge Functions
const MAX_PROCESSING_MS = 3 * 3600_000;  // desiste se a rede não terminar de processar em 3 h
const SIGNED_URL_SECS = 6 * 3600;        // Instagram/Facebook baixam o vídeo por esta URL

export async function publisher(req: Request): Promise<Response> {
  if (req.headers.get('x-cron-secret') !== env('CRON_SECRET')) return json({ error: 'forbidden' }, 403);

  const db = admin();
  const started = Date.now();
  const results: unknown[] = [];

  while (Date.now() - started < TIME_BUDGET_MS) {
    const { data: rows, error } = await db.rpc('claim_due_targets', { p_limit: 1 });
    if (error) return json({ error: error.message }, 500);
    if (!rows?.length) break;
    for (const t of rows) results.push(await processTarget(db, t));
  }
  return json({ processed: results.length, results });
}

// deno-lint-ignore no-explicit-any
async function processTarget(db: SupabaseClient, t: any) {
  const now = new Date();
  const update = (patch: Record<string, unknown>) =>
    db.from('post_targets').update({ ...patch, locked_until: null, updated_at: now.toISOString() }).eq('id', t.id);

  const { data: post } = await db.from('posts').select('*').eq('id', t.post_id).single<Post>();
  const { data: account } = await db.from('accounts').select('*').eq('id', t.account_id).single<Account>();
  if (!post || !account) {
    await update({ status: 'failed', error: 'Post ou conta não encontrados.' });
    return { id: t.id, status: 'failed' };
  }

  try {
    if (account.status === 'reconnect') throw new ApiError('Conta desconectada — reconecte na aba Contas.', { auth: true });
    if (t.processing_since && now.getTime() - Date.parse(t.processing_since) > MAX_PROCESSING_MS) {
      throw new ApiError('A rede não terminou de processar o vídeo a tempo.', { permanent: true });
    }

    const tokens = await freshTokens(db, account);
    const { data: signed, error: se } = await db.storage.from('videos').createSignedUrl(post.video_path, SIGNED_URL_SECS);
    if (se || !signed) throw new ApiError(`Vídeo não encontrado no armazenamento: ${se?.message ?? ''}`, { permanent: true });

    const r = await PUBLISHERS[account.platform]({
      account,
      tokens,
      post,
      caption: (t.caption ?? post.caption ?? '').trim(),
      format: t.format ?? 'feed',
      videoUrl: signed.signedUrl,
      state: t.remote_state ?? {},
    });

    if (r.status === 'published') {
      await update({ status: 'published', external_id: r.externalId, published_url: r.url ?? null, error: null, remote_state: null });
    } else {
      await update({
        status: 'processing',
        remote_state: r.state,
        processing_since: t.processing_since ?? now.toISOString(),
        next_attempt_at: new Date(now.getTime() + r.retryInSec * 1000).toISOString(),
      });
    }
  } catch (e) {
    const err = e instanceof ApiError ? e : new ApiError((e as Error).message ?? String(e));
    const attempts = t.attempts + 1;
    if (err.auth) await db.from('accounts').update({ status: 'reconnect' }).eq('id', account.id);
    const final = err.auth || err.permanent || attempts >= MAX_ATTEMPTS;
    await update({
      status: final ? 'failed' : t.status,  // mantém 'processing' + remote_state para não reenviar o vídeo
      attempts,
      error: err.message.slice(0, 1000),
      next_attempt_at: new Date(now.getTime() + 2 ** attempts * 60_000).toISOString(),
    });
  }

  await settlePost(db, post);
  return { id: t.id, platform: account.platform };
}

/** Renova o token se estiver vencendo; se não houver como renovar, a conta precisa reconectar. */
async function freshTokens(db: SupabaseClient, account: Account): Promise<Tokens> {
  const { data: tok } = await db.from('account_tokens').select('*').eq('account_id', account.id).single<Tokens>();
  if (!tok) throw new ApiError('Tokens não encontrados — reconecte a conta.', { auth: true });
  if (!tok.expires_at || Date.parse(tok.expires_at) - Date.now() > 5 * 60_000) return tok;

  const refresh = REFRESHERS[account.platform];
  if (!refresh) throw new ApiError('Conexão vencida — reconecte a conta.', { auth: true });
  const fresh = await refresh(tok);
  const merged = { ...tok, ...fresh, refresh_token: fresh.refresh_token ?? tok.refresh_token };
  await db.from('account_tokens').update({
    access_token: merged.access_token,
    refresh_token: merged.refresh_token,
    expires_at: merged.expires_at,
    updated_at: new Date().toISOString(),
  }).eq('account_id', account.id);
  return merged;
}

/** Atualiza o status geral do post e apaga o vídeo quando tudo foi publicado. */
async function settlePost(db: SupabaseClient, post: Post) {
  const { data: ts } = await db.from('post_targets').select('status').eq('post_id', post.id);
  const s = (ts ?? []).map((x) => x.status as string);
  let status: string;
  if (s.some((x) => x === 'pending' || x === 'processing')) status = 'publishing';
  else if (s.every((x) => x === 'canceled')) status = 'canceled';
  else if (s.some((x) => x === 'failed')) status = s.some((x) => x === 'published') ? 'partial' : 'failed';
  else status = 'published';

  await db.from('posts').update({ status }).eq('id', post.id);
  if (status === 'published') await db.storage.from('videos').remove([post.video_path]);
}
