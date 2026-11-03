import type { PlatformId, Provider, Publisher, Refresher } from '../types.ts';
import { google, publishYoutube, refreshYoutube } from './youtube.ts';
import { publishTiktok, refreshTiktok, tiktokProvider } from './tiktok.ts';
import { meta, publishFacebook, publishInstagram } from './meta.ts';
import { linkedin, publishLinkedin } from './linkedin.ts';

/** Logins disponíveis (o login "meta" conecta Facebook e Instagram de uma vez). */
export const PROVIDERS: Record<string, Provider> = { google, tiktok: tiktokProvider, meta, linkedin };

export const PUBLISHERS: Record<PlatformId, Publisher> = {
  youtube: publishYoutube,
  tiktok: publishTiktok,
  facebook: publishFacebook,
  instagram: publishInstagram,
  linkedin: publishLinkedin,
};

/** Redes cujo token expira e pode ser renovado sozinho. As demais não expiram ou exigem reconexão. */
export const REFRESHERS: Partial<Record<PlatformId, Refresher>> = {
  youtube: refreshYoutube,
  tiktok: refreshTiktok,
};
