import { ApiError, call, env, fetchRange, form, inSeconds } from '../core.ts';
import type { Provider, Publisher, Refresher } from '../types.ts';

const SCOPES = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly';
const CHUNK = 8 * 1024 * 1024; // múltiplo de 256 KB, exigido pelo upload retomável

export const google: Provider = {
  authUrl(state, redirectUri) {
    const q = new URLSearchParams({
      client_id: env('GOOGLE_CLIENT_ID'),
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES,
      access_type: 'offline',
      prompt: 'consent',
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
  },

  async exchange(code, redirectUri) {
    const tok = await (await call('Google token', 'https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: form({
        code,
        client_id: env('GOOGLE_CLIENT_ID'),
        client_secret: env('GOOGLE_CLIENT_SECRET'),
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })).json();

    const ch = await (await call('YouTube canal', 'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
      headers: { Authorization: `Bearer ${tok.access_token}` },
    })).json();
    const c = ch.items?.[0];
    if (!c) throw new ApiError('Esta conta Google não tem canal no YouTube.', { permanent: true });

    return [{
      platform: 'youtube',
      external_id: c.id,
      name: c.snippet?.title ?? 'YouTube',
      avatar_url: c.snippet?.thumbnails?.default?.url ?? null,
      tokens: { access_token: tok.access_token, refresh_token: tok.refresh_token ?? null, expires_at: inSeconds(tok.expires_in) },
    }];
  },
};

export const refreshYoutube: Refresher = async (t) => {
  if (!t.refresh_token) throw new ApiError('YouTube sem refresh token — reconecte a conta.', { auth: true });
  const r = await (await call('Google refresh', 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: form({
      client_id: env('GOOGLE_CLIENT_ID'),
      client_secret: env('GOOGLE_CLIENT_SECRET'),
      refresh_token: t.refresh_token,
      grant_type: 'refresh_token',
    }),
  }).catch((e) => { throw new ApiError(e.message, { auth: true }); })).json();
  return { access_token: r.access_token, expires_at: inSeconds(r.expires_in) };
};

const cleanTitle = (s: string) => s.replace(/[<>]/g, '').trim().slice(0, 100) || 'Vídeo';

export const publishYoutube: Publisher = async ({ tokens, post, caption, videoUrl }) => {
  const size = post.video_size;
  const init = await call(
    'YouTube início do upload',
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Length': String(size),
        'X-Upload-Content-Type': post.video_type,
      },
      body: JSON.stringify({
        snippet: {
          title: cleanTitle(post.title || caption.split('\n')[0] || ''),
          description: caption.slice(0, 5000),
          categoryId: env('YOUTUBE_CATEGORY_ID', '22'),
        },
        status: { privacyStatus: env('YOUTUBE_PRIVACY', 'public'), selfDeclaredMadeForKids: false },
      }),
    },
  );
  const location = init.headers.get('Location');
  if (!location) throw new ApiError('YouTube não retornou a URL de upload.');

  let start = 0;
  while (start < size) {
    const end = Math.min(start + CHUNK, size) - 1;
    const bytes = await fetchRange(videoUrl, start, end);
    const res = await fetch(location, {
      method: 'PUT',
      redirect: 'manual', // 308 = "continue enviando", não é redirecionamento
      headers: { 'Content-Length': String(bytes.byteLength), 'Content-Range': `bytes ${start}-${end}/${size}` },
      body: bytes,
    });
    if (res.status === 308) {
      const range = res.headers.get('Range'); // ex.: bytes=0-8388607
      start = range ? Number(range.split('-')[1]) + 1 : end + 1;
      await res.body?.cancel();
      continue;
    }
    if (res.ok) {
      const v = await res.json();
      return { status: 'published', externalId: v.id, url: `https://youtu.be/${v.id}` };
    }
    throw new ApiError(`YouTube upload: HTTP ${res.status} — ${(await res.text()).slice(0, 300)}`, { auth: res.status === 401 });
  }
  throw new ApiError('YouTube: upload terminou sem confirmação.');
};
