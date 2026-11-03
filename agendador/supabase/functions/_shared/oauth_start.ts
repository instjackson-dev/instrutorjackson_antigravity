// Gera a URL de login da rede escolhida para o usuário logado.
import { admin, cors, json, redirectUri } from './core.ts';
import { PROVIDERS } from './platforms/index.ts';

export async function oauthStart(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const db = admin();
    const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data: { user } } = await db.auth.getUser(jwt);
    if (!user) return json({ error: 'Faça login novamente.' }, 401);

    const { provider } = await req.json().catch(() => ({}));
    const p = PROVIDERS[provider];
    if (!p) return json({ error: 'Rede inválida.' }, 400);

    const state = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
    const { error } = await db.from('oauth_states').insert({ state, user_id: user.id, provider });
    if (error) throw error;

    return json({ url: p.authUrl(state, redirectUri()) });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
}
