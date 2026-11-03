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

// Upload hospedado do Facebook (Reels e Stories): a Meta baixa o vídeo da URL temporária.
async function facebookHostedUpload(kind: 'video_reels' | 'video_stories', page: string, token: string, videoUrl: string) {
  const start = await (await call(`Facebook ${kind} início`, `${GRAPH()}/${page}/${kind}`, {
    method: 'POST',
    body: form({ upload_phase: 'start', access_token: token }),
  })).json();
  const up = await (await call(`Facebook ${kind} upload`, start.upload_url ?? `https://rupload.facebook.com/video-upload/${V()}/${start.video_id}`, {
    method: 'POST',
    headers: { Authorization: `OAuth ${token}`, file_url: videoUrl },
  })).json();
  if (up.success === false) throw new ApiError(`Facebook ${kind}: upload recusado.`);
  return String(start.video_id);
}

const FB_STEP: Record<string, string> = { uploading_phase: 'upload', processing_phase: 'processamento', publishing_phase: 'publicação' };

export const publishFacebook: Publisher = async ({ account, tokens, post, caption, format, videoUrl, state }) => {
  const page = account.external_id, token = tokens.access_token;

  if (format === 'stories') {
    const videoId = await facebookHostedUpload('video_stories', page, token, videoUrl);
    const fin = await (await call('Facebook Stories publicar', `${GRAPH()}/${page}/video_stories`, {
      method: 'POST',
      body: form({ upload_phase: 'finish', video_id: videoId, access_token: token }),
    })).json();
    return { status: 'published', externalId: String(fin.post_id ?? videoId) };
  }

  if (format === 'reels') {
    if (!state.video_id) {
      const videoId = await facebookHostedUpload('video_reels', page, token, videoUrl);
      await call('Facebook Reels publicar', `${GRAPH()}/${page}/video_reels`, {
        method: 'POST',
        body: form({ upload_phase: 'finish', video_id: videoId, video_state: 'PUBLISHED', description: caption, access_token: token }),
      });
      return { status: 'processing', state: { video_id: videoId }, retryInSec: 30 };
    }
    const s = await get('Facebook Reels status', `/${state.video_id}`, { fields: 'status', access_token: token });
    for (const [phase, label] of Object.entries(FB_STEP)) {
      if (s.status?.[phase]?.status === 'error') {
        throw new ApiError(`Facebook recusou o Reels na etapa de ${label}: ${s.status[phase].errors?.[0]?.message ?? 'sem detalhe'}`, { permanent: true });
      }
    }
    if (s.status?.publishing_phase?.status !== 'complete') return { status: 'processing', state, retryInSec: 30 };
    return { status: 'published', externalId: state.video_id, url: `https://www.facebook.com/reel/${state.video_id}` };
  }

  // Feed: vídeo comum da Página
  const res = await (await call('Facebook vídeo', `https://graph-video.facebook.com/${V()}/${page}/videos`, {
    method: 'POST',
    body: form({
      file_url: videoUrl,
      description: caption,
      ...(post.title ? { title: post.title } : {}),
      access_token: token,
    }),
  })).json();
  return { status: 'published', externalId: res.id, url: `https://www.facebook.com/${res.id}` };
};

export const publishInstagram: Publisher = async ({ account, tokens, caption, format, videoUrl, state }) => {
  const ig = account.external_id, token = tokens.access_token;
  const stories = format === 'stories';

  if (!state.container) {
    // Reels com share_to_feed também aparece no Feed. Stories não aceita legenda.
    const params: Record<string, string> = stories
      ? { media_type: 'STORIES', video_url: videoUrl, access_token: token }
      : { media_type: 'REELS', video_url: videoUrl, caption: caption.slice(0, 2200), share_to_feed: 'true', access_token: token };
    const c = await (await call(`Instagram ${stories ? 'Stories' : 'Reels'} container`, `${GRAPH()}/${ig}/media`, {
      method: 'POST',
      body: form(params),
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
