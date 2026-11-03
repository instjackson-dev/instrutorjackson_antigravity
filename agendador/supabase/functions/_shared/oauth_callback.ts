// Retorno do login das redes: troca o código por tokens, salva as contas e volta para o app.
import { admin, env, redirectUri } from './core.ts';
import { PROVIDERS } from './platforms/index.ts';

const STATE_TTL_MS = 15 * 60 * 1000;

export async function oauthCallback(req: Request): Promise<Response> {
  const app = env('APP_URL').replace(/\/$/, '');
  const back = (q: Record<string, string>) => Response.redirect(`${app}/?${new URLSearchParams(q)}#contas`, 302);

  const u = new URL(req.url);
  const code = u.searchParams.get('code');
  const state = u.searchParams.get('state');
  const denied = u.searchParams.get('error_description') ?? u.searchParams.get('error');
  if (!state) return back({ erro: 'Retorno sem identificação (state).' });

  const db = admin();
  const { data: st } = await db.from('oauth_states').delete().eq('state', state).select().maybeSingle();
  if (!st || Date.now() - Date.parse(st.created_at) > STATE_TTL_MS) return back({ erro: 'Login expirado. Tente conectar de novo.' });
  if (denied || !code) return back({ erro: `Conexão cancelada: ${denied ?? 'sem código'}` });

  try {
    const accounts = await PROVIDERS[st.provider].exchange(code, redirectUri());
    for (const a of accounts) {
      const { data: row, error } = await db.from('accounts').upsert({
        user_id: st.user_id,
        platform: a.platform,
        external_id: a.external_id,
        name: a.name,
        avatar_url: a.avatar_url ?? null,
        reconnect_by: a.reconnect_by ?? null,
        status: 'ok',
      }, { onConflict: 'user_id,platform,external_id' }).select('id').single();
      if (error) throw error;

      const { error: e2 } = await db.from('account_tokens').upsert({
        account_id: row.id,
        access_token: a.tokens.access_token,
        refresh_token: a.tokens.refresh_token ?? null,
        expires_at: a.tokens.expires_at ?? null,
        meta: a.tokens.meta ?? {},
        updated_at: new Date().toISOString(),
      });
      if (e2) throw e2;
    }
    return back({ ok: st.provider, n: String(accounts.length) });
  } catch (e) {
    return back({ erro: (e as Error).message.slice(0, 300) });
  }
}
