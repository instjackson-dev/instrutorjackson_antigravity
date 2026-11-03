// LinkedIn — perfil pessoal (permissão w_member_social, liberada no produto "Share on LinkedIn").
import { ApiError, call, env, fetchRange, form, inSeconds } from '../core.ts';
import type { Provider, Publisher } from '../types.ts';

const rest = () => ({
  'LinkedIn-Version': env('LINKEDIN_VERSION', '202510'),
  'X-Restli-Protocol-Version': '2.0.0',
  'Content-Type': 'application/json',
});

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
  const auth = { Authorization: `Bearer ${tokens.access_token}`, ...rest() };
  const owner = `urn:li:person:${account.external_id}`;

  if (!state.video) {
    const init = await (await call('LinkedIn início do upload', 'https://api.linkedin.com/rest/videos?action=initializeUpload', {
      method: 'POST',
      headers: auth,
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

    await call('LinkedIn finalizar upload', 'https://api.linkedin.com/rest/videos?action=finalizeUpload', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ finalizeUploadRequest: { video, uploadToken: uploadToken ?? '', uploadedPartIds: etags } }),
    });
    return { status: 'processing', state: { video: String(video) }, retryInSec: 20 };
  }

  const v = await (await call('LinkedIn status', `https://api.linkedin.com/rest/videos/${encodeURIComponent(state.video ?? '')}`, {
    headers: auth,
  })).json();
  if (v.status === 'PROCESSING_FAILED') throw new ApiError('LinkedIn não conseguiu processar o vídeo.', { permanent: true });
  if (v.status !== 'AVAILABLE') return { status: 'processing', state, retryInSec: 20 };

  const res = await call('LinkedIn post', 'https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers: auth,
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
