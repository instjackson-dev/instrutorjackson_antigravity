import { ApiError, call, env, fetchRange, form, inSeconds } from '../core.ts';
import type { Provider, Publisher, Refresher } from '../types.ts';

const API = 'https://open.tiktokapis.com/v2';
const MB = 1024 * 1024;

async function tiktok(label: string, path: string, token: string, body?: unknown) {
  const res = await call(label, `${API}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=UTF-8' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const j = await res.json();
  if (j.error && j.error.code !== 'ok') {
    throw new ApiError(`${label}: ${j.error.code} — ${j.error.message}`, {
      auth: j.error.code === 'access_token_invalid' || j.error.code === 'scope_not_authorized',
    });
  }
  return j.data;
}

export const tiktokProvider: Provider = {
  authUrl(state, redirectUri) {
    const q = new URLSearchParams({
      client_key: env('TIKTOK_CLIENT_KEY'),
      scope: 'user.info.basic,video.publish',
      response_type: 'code',
      redirect_uri: redirectUri,
      state,
    });
    return `https://www.tiktok.com/v2/auth/authorize/?${q}`;
  },

  async exchange(code, redirectUri) {
    const tok = await (await call('TikTok token', `${API}/oauth/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form({
        client_key: env('TIKTOK_CLIENT_KEY'),
        client_secret: env('TIKTOK_CLIENT_SECRET'),
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })).json();
    if (!tok.access_token) throw new ApiError(`TikTok token: ${tok.error_description ?? tok.error ?? 'falha'}`, { permanent: true });

    const info = await tiktok('TikTok perfil', '/user/info/?fields=open_id,display_name,avatar_url', tok.access_token);
    return [{
      platform: 'tiktok',
      external_id: tok.open_id,
      name: info.user?.display_name ?? 'TikTok',
      avatar_url: info.user?.avatar_url ?? null,
      reconnect_by: inSeconds(tok.refresh_expires_in),
      tokens: { access_token: tok.access_token, refresh_token: tok.refresh_token, expires_at: inSeconds(tok.expires_in) },
    }];
  },
};

export const refreshTiktok: Refresher = async (t) => {
  if (!t.refresh_token) throw new ApiError('TikTok sem refresh token — reconecte a conta.', { auth: true });
  const r = await (await call('TikTok refresh', `${API}/oauth/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form({
      client_key: env('TIKTOK_CLIENT_KEY'),
      client_secret: env('TIKTOK_CLIENT_SECRET'),
      grant_type: 'refresh_token',
      refresh_token: t.refresh_token,
    }),
  })).json();
  if (!r.access_token) throw new ApiError(`TikTok refresh: ${r.error_description ?? 'falha'} — reconecte a conta.`, { auth: true });
  return { access_token: r.access_token, refresh_token: r.refresh_token, expires_at: inSeconds(r.expires_in) };
};

/** Regras do TikTok: até 64 MB vai inteiro; acima, pedaços de 10 MB e o último absorve o resto. */
function chunking(size: number) {
  if (size <= 64 * MB) return { chunkSize: size, count: 1 };
  const chunkSize = 10 * MB;
  return { chunkSize, count: Math.floor(size / chunkSize) };
}

export const publishTiktok: Publisher = async ({ tokens, post, caption, videoUrl, state }) => {
  const token = tokens.access_token;

  if (!state.publish_id) {
    const creator = await tiktok('TikTok creator_info', '/post/publish/creator_info/query/', token, {});
    const wanted = env('TIKTOK_PRIVACY', 'SELF_ONLY');
    const options: string[] = creator.privacy_level_options ?? [];
    const privacy = options.includes(wanted) ? wanted : 'SELF_ONLY';

    const size = post.video_size;
    const { chunkSize, count } = chunking(size);
    const init = await tiktok('TikTok início do upload', '/post/publish/video/init/', token, {
      post_info: {
        title: caption.slice(0, 2200),
        privacy_level: privacy,
        disable_comment: false,
        disable_duet: false,
        disable_stitch: false,
      },
      source_info: { source: 'FILE_UPLOAD', video_size: size, chunk_size: chunkSize, total_chunk_count: count },
    });

    for (let i = 0; i < count; i++) {
      const start = i * chunkSize;
      const end = i === count - 1 ? size - 1 : start + chunkSize - 1;
      const bytes = await fetchRange(videoUrl, start, end);
      await call(`TikTok upload parte ${i + 1}/${count}`, init.upload_url, {
        method: 'PUT',
        headers: {
          'Content-Type': post.video_type,
          'Content-Length': String(bytes.byteLength),
          'Content-Range': `bytes ${start}-${end}/${size}`,
        },
        body: bytes,
      });
    }
    return { status: 'processing', state: { publish_id: String(init.publish_id) }, retryInSec: 30 };
  }

  const st = await tiktok('TikTok status', '/post/publish/status/fetch/', token, { publish_id: state.publish_id });
  if (st.status === 'PUBLISH_COMPLETE' || st.status === 'SEND_TO_USER_INBOX') {
    const id = st.publicaly_available_post_id?.[0];
    return { status: 'published', externalId: String(id ?? state.publish_id) };
  }
  if (st.status === 'FAILED') throw new ApiError(`TikTok recusou o vídeo: ${st.fail_reason ?? 'motivo não informado'}`, { permanent: true });
  return { status: 'processing', state, retryInSec: 30 };
};
