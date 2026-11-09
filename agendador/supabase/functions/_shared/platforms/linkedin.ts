// LinkedIn — perfil pessoal (permissão w_member_social, liberada no produto "Share on LinkedIn").
import { ApiError, call, env, fetchRange, form, inSeconds } from '../core.ts';
import type { Provider, Publisher } from '../types.ts';

// O LinkedIn exige o cabeçalho LinkedIn-Version (AAAAMM) e desativa versões antigas com o tempo.
// Tenta LINKEDIN_VERSION (se definida) e depois os últimos 12 meses, guardando a primeira que funcionar.
let activeVersion: string | null = null;

function candidateVersions(): string[] {
  const out: string[] = [];
  const fixed = Deno.env.get('LINKEDIN_VERSION');
  if (fixed) out.push(fixed);
  const d = new Date();
  for (let i = 0; i < 12; i++) {
    out.push(`${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
    d.setUTCMonth(d.getUTCMonth() - 1, 1);
  }
  return [...new Set(out)];
}

/** Chamada à API REST do LinkedIn com a versão ativa (resposta 426 = versão inativa, tenta a próxima). */
async function liRest(label: string, url: string, token: string, init: RequestInit = {}): Promise<Response> {
  const versions = activeVersion ? [activeVersion] : candidateVersions();
  let last: unknown;
  for (const v of versions) {
    try {
      const res = await call(label, url, {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          'LinkedIn-Version': v,
          'X-Restli-Protocol-Version': '2.0.0',
          'Content-Type': 'application/json',
          ...(init.headers ?? {}),
        },
      });
      activeVersion = v;
      return res;
    } catch (e) {
      last = e;
      if (!(e instanceof ApiError && /HTTP 426/.test(e.message))) throw e;
      if (activeVersion) { activeVersion = null; return liRest(label, url, token, init); }
    }
  }
  throw last;
}

// O campo "commentary" usa o formato "little text": estes caracteres precisam de barra invertida.
const escapeLittleText = (s: string) => s.replace(/[\\|{}@[\]()<>#*_~]/g, (c) => `\\${c}`);

export const linkedin: Provider = {
  authUrl(state, redirectUri) {
    const q = new URLSearchParams({
      response_type: 'code',
      client_id: env('LINKEDIN_CLIENT_ID'),
      redirect_uri: redirectUri,
      state,
      scope: 'openid profile w_member_social',
    });
    return `https://www.linkedin.com/oauth/v2/authorization?${q}`;
  },

  async exchange(code, redirectUri) {
    const tok = await (await call('LinkedIn token', 'https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: env('LINKEDIN_CLIENT_ID'),
        client_secret: env('LINKEDIN_CLIENT_SECRET'),
      }),
    })).json();
    const me = await (await call('LinkedIn perfil', 'https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tok.access_token}` },
    })).json();
    const expires = inSeconds(tok.expires_in);
    return [{
      platform: 'linkedin',
      external_id: me.sub,
      name: me.name ?? 'LinkedIn',
      avatar_url: me.picture ?? null,
      reconnect_by: expires, // token de 60 dias, sem renovação automática para apps comuns
      tokens: { access_token: tok.access_token, refresh_token: tok.refresh_token ?? null, expires_at: expires },
    }];
  },
};

export const publishLinkedin: Publisher = async ({ account, tokens, post, caption, videoUrl, state }) => {
  const token = tokens.access_token;
  const owner = `urn:li:person:${account.external_id}`;

  if (!state.video) {
    const init = await (await liRest('LinkedIn início do upload', 'https://api.linkedin.com/rest/videos?action=initializeUpload', token, {
      method: 'POST',
      body: JSON.stringify({
        initializeUploadRequest: { owner, fileSizeBytes: post.video_size, uploadCaptions: false, uploadThumbnail: false },
      }),
    })).json();
    const { video, uploadToken, uploadInstructions } = init.value;

    const etags: string[] = [];
    for (const part of uploadInstructions as { uploadUrl: string; firstByte: number; lastByte: number }[]) {
      const bytes = await fetchRange(videoUrl, part.firstByte, part.lastByte);
      const res = await call('LinkedIn upload', part.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: bytes,
      });
      const etag = res.headers.get('etag');
      if (!etag) throw new ApiError('LinkedIn não retornou o ETag de uma parte do upload.');
      etags.push(etag);
    }

    await liRest('LinkedIn finalizar upload', 'https://api.linkedin.com/rest/videos?action=finalizeUpload', token, {
      method: 'POST',
      body: JSON.stringify({ finalizeUploadRequest: { video, uploadToken: uploadToken ?? '', uploadedPartIds: etags } }),
    });
    return { status: 'processing', state: { video: String(video) }, retryInSec: 20 };
  }

  const v = await (await liRest('LinkedIn status', `https://api.linkedin.com/rest/videos/${encodeURIComponent(state.video ?? '')}`, token)).json();
  if (v.status === 'PROCESSING_FAILED') throw new ApiError('LinkedIn não conseguiu processar o vídeo.', { permanent: true });
  if (v.status !== 'AVAILABLE') return { status: 'processing', state, retryInSec: 20 };

  const res = await liRest('LinkedIn post', 'https://api.linkedin.com/rest/posts', token, {
    method: 'POST',
    body: JSON.stringify({
      author: owner,
      commentary: escapeLittleText(caption.slice(0, 3000)),
      visibility: 'PUBLIC',
      distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
      content: { media: { title: (post.title ?? '').slice(0, 200), id: state.video } },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    }),
  });
  const urn = res.headers.get('x-restli-id') ?? '';
  return { status: 'published', externalId: urn, url: urn ? `https://www.linkedin.com/feed/update/${urn}` : undefined };
};
