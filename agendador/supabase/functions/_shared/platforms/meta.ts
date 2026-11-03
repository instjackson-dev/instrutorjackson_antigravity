// Facebook (Páginas) e Instagram (conta Profissional ligada à Página) — mesmo login Meta.
import { ApiError, call, env, form } from '../core.ts';
import type { NewAccount, Provider, Publisher } from '../types.ts';

const V = () => env('META_GRAPH_VERSION', 'v21.0');
const GRAPH = () => `https://graph.facebook.com/${V()}`;

const SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'instagram_basic',
  'instagram_content_publish',
  'business_management',
].join(',');

const get = async (label: string, path: string, params: Record<string, string>) =>
  (await call(label, `${GRAPH()}${path}?${new URLSearchParams(params)}`)).json();

export const meta: Provider = {
  authUrl(state, redirectUri) {
    const q = new URLSearchParams({ client_id: env('META_APP_ID'), redirect_uri: redirectUri, state, scope: SCOPES, response_type: 'code' });
    return `https://www.facebook.com/${V()}/dialog/oauth?${q}`;
  },

  async exchange(code, redirectUri) {
    const appId = env('META_APP_ID'), secret = env('META_APP_SECRET');
    const short = await get('Meta token', '/oauth/access_token', { client_id: appId, client_secret: secret, redirect_uri: redirectUri, code });
    // Token de usuário de longa duração => tokens de Página sem expiração
    const long = await get('Meta token longo', '/oauth/access_token', {
      grant_type: 'fb_exchange_token', client_id: appId, client_secret: secret, fb_exchange_token: short.access_token,
    });
    const pages = await get('Meta páginas', '/me/accounts', {
      fields: 'id,name,access_token,picture{url},instagram_business_account{id,username,profile_picture_url}',
      limit: '100',
      access_token: long.access_token,
    });

    const out: NewAccount[] = [];
    for (const p of pages.data ?? []) {
      out.push({
        platform: 'facebook',
        external_id: p.id,
        name: p.name,
        avatar_url: p.picture?.data?.url ?? null,
        tokens: { access_token: p.access_token },
      });
      const ig = p.instagram_business_account;
      if (ig) {
        out.push({
          platform: 'instagram',
          external_id: ig.id,
          name: ig.username ? `@${ig.username}` : 'Instagram',
          avatar_url: ig.profile_picture_url ?? null,
          tokens: { access_token: p.access_token, meta: { page_id: p.id } },
        });
      }
    }
    if (!out.length) throw new ApiError('Nenhuma Página do Facebook encontrada. Autorize ao menos uma Página no login.', { permanent: true });
    return out;
  },
};

export const publishFacebook: Publisher = async ({ account, tokens, post, caption, videoUrl }) => {
  const res = await (await call('Facebook vídeo', `https://graph-video.facebook.com/${V()}/${account.external_id}/videos`, {
    method: 'POST',
    body: form({
      file_url: videoUrl,
      description: caption,
      ...(post.title ? { title: post.title } : {}),
      access_token: tokens.access_token,
    }),
  })).json();
  return { status: 'published', externalId: res.id, url: `https://www.facebook.com/${res.id}` };
};

export const publishInstagram: Publisher = async ({ account, tokens, caption, videoUrl, state }) => {
  const ig = account.external_id, token = tokens.access_token;

  if (!state.container) {
    const c = await (await call('Instagram container', `${GRAPH()}/${ig}/media`, {
      method: 'POST',
      body: form({ media_type: 'REELS', video_url: videoUrl, caption: caption.slice(0, 2200), share_to_feed: 'true', access_token: token }),
    })).json();
    return { status: 'processing', state: { container: String(c.id) }, retryInSec: 30 };
  }

  const s = await get('Instagram status', `/${state.container}`, { fields: 'status_code,status', access_token: token });
  if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') {
    throw new ApiError(`Instagram recusou o vídeo: ${s.status ?? s.status_code}`, { permanent: true });
  }
  if (s.status_code !== 'FINISHED') return { status: 'processing', state, retryInSec: 30 };

  const pub = await (await call('Instagram publicar', `${GRAPH()}/${ig}/media_publish`, {
    method: 'POST',
    body: form({ creation_id: state.container, access_token: token }),
  })).json();
  const link = await get('Instagram link', `/${pub.id}`, { fields: 'permalink', access_token: token }).catch(() => ({}));
  return { status: 'published', externalId: pub.id, url: (link as { permalink?: string }).permalink };
};
