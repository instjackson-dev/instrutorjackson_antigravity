import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const MAX_MB = Number(import.meta.env.VITE_MAX_MB || 50);

// PKCE: o retorno do login vem em ?code= (não conflita com as abas em #)
export const supabase = createClient(SUPABASE_URL || 'http://localhost', SUPABASE_ANON_KEY || 'anon', { auth: { flowType: 'pkce' } });

export const PLATFORMS = {
  youtube: { label: 'YouTube', color: '#FF0000', provider: 'google', limit: 5000 },
  tiktok: { label: 'TikTok', color: '#25F4EE', provider: 'tiktok', limit: 2200 },
  instagram: { label: 'Instagram', color: '#E1306C', provider: 'meta', limit: 2200 },
  facebook: { label: 'Facebook', color: '#1877F2', provider: 'meta', limit: 63000 },
  linkedin: { label: 'LinkedIn', color: '#0A66C2', provider: 'linkedin', limit: 3000 },
};

/**
 * Formatos por rede. maxSec/minSec = limites de duração da própria rede (validados antes de agendar).
 * Stories não usam legenda.
 */
export const FORMATS = {
  youtube: [{ id: 'feed', label: 'Vídeo / Shorts', hint: 'Vertical e até 3 min vira Shorts automaticamente' }],
  tiktok: [{ id: 'feed', label: 'Vídeo', maxSec: 600 }],
  instagram: [
    { id: 'reels', label: 'Reels + Feed', maxSec: 900 },
    { id: 'stories', label: 'Stories', maxSec: 60, noCaption: true },
  ],
  facebook: [
    { id: 'feed', label: 'Feed' },
    { id: 'reels', label: 'Reels', minSec: 3, maxSec: 90 },
    { id: 'stories', label: 'Stories', maxSec: 60, noCaption: true },
  ],
  linkedin: [{ id: 'feed', label: 'Feed', maxSec: 600 }],
};

export const formatLabel = (platform, format) =>
  FORMATS[platform]?.find((f) => f.id === format)?.label ?? format;

export const PROVIDERS = [
  { id: 'google', label: 'YouTube', note: 'Canal do YouTube' },
  { id: 'meta', label: 'Facebook + Instagram', note: 'Páginas e Instagram Profissional ligado a elas' },
  { id: 'tiktok', label: 'TikTok', note: 'Perfil do TikTok' },
  { id: 'linkedin', label: 'LinkedIn', note: 'Perfil pessoal' },
];

export const STATUS = {
  scheduled: ['Agendado', 'info'],
  publishing: ['Publicando', 'warn'],
  published: ['Publicado', 'ok'],
  partial: ['Parcial', 'warn'],
  failed: ['Falhou', 'err'],
  canceled: ['Cancelado', 'muted'],
  pending: ['Aguardando', 'info'],
  processing: ['Processando', 'warn'],
};

export const fmtDate = (iso) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Valor para <input type="datetime-local"> no fuso local. */
export function toLocalInput(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Upload direto ao Storage com barra de progresso (o supabase-js não informa progresso). */
export function uploadWithProgress(path, file, onProgress) {
  return new Promise(async (resolve, reject) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return reject(new Error('Sessão expirada. Entre de novo.'));
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/videos/${path}`);
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
    xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Falha no upload (${xhr.status}): ${xhr.responseText.slice(0, 200)}`)));
    xhr.onerror = () => reject(new Error('Falha de rede no upload.'));
    xhr.send(file);
  });
}
