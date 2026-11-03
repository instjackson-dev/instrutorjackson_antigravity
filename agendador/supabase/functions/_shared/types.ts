/** Etapa em andamento numa rede (ex.: id do container do Instagram). */
export type RemoteState = Record<string, string | undefined>;

/** Formato da publicação na rede. */
export type Format = 'feed' | 'reels' | 'stories';

export type PlatformId = 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'linkedin';

export interface Tokens {
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  meta: Record<string, unknown>;
}

export interface Account {
  id: string;
  user_id: string;
  platform: PlatformId;
  external_id: string;
  name: string | null;
  status: 'ok' | 'reconnect';
}

export interface Post {
  id: string;
  title: string | null;
  caption: string | null;
  video_path: string;
  video_size: number;
  video_type: string;
}

export interface PublishCtx {
  account: Account;
  tokens: Tokens;
  post: Post;
  caption: string;
  format: Format;
  videoUrl: string;                    // URL assinada e temporária do vídeo
  state: RemoteState;                  // etapa salva da execução anterior
}

export type PublishResult =
  | { status: 'published'; externalId: string; url?: string }
  | { status: 'processing'; state: RemoteState; retryInSec: number };

/** Conta retornada por um login OAuth (um login Meta pode trazer Página + Instagram). */
export interface NewAccount {
  platform: PlatformId;
  external_id: string;
  name: string;
  avatar_url?: string | null;
  reconnect_by?: string | null;
  tokens: { access_token: string; refresh_token?: string | null; expires_at?: string | null; meta?: Record<string, unknown> };
}

export interface Provider {
  authUrl(state: string, redirectUri: string): string;
  exchange(code: string, redirectUri: string): Promise<NewAccount[]>;
}

export type Refresher = (t: Tokens) => Promise<Pick<Tokens, 'access_token' | 'expires_at'> & { refresh_token?: string | null }>;
export type Publisher = (ctx: PublishCtx) => Promise<PublishResult>;
