import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export function env(key: string, fallback?: string): string {
  const v = Deno.env.get(key) ?? fallback;
  if (v === undefined || v === '') throw new Error(`Variável de ambiente ausente: ${key}`);
  return v;
}

export const admin = (): SupabaseClient =>
  createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });

export const redirectUri = () => env('OAUTH_REDIRECT_URI', `${env('SUPABASE_URL')}/functions/v1/oauth-callback`);

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

export const inSeconds = (s?: number | null) => (s ? new Date(Date.now() + s * 1000).toISOString() : null);

/** Erro de API. `auth` = conta precisa reconectar; `permanent` = não adianta tentar de novo. */
export class ApiError extends Error {
  auth: boolean;
  permanent: boolean;
  constructor(message: string, opts: { auth?: boolean; permanent?: boolean } = {}) {
    super(message);
    this.auth = !!opts.auth;
    this.permanent = !!opts.permanent;
  }
}

/** fetch que lança ApiError com a mensagem da rede quando a resposta não é 2xx. */
export async function call(label: string, url: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, init);
  if (res.ok) return res;
  const text = await res.text().catch(() => '');
  let detail = text.slice(0, 500);
  let metaCode: number | undefined;
  try {
    const j = JSON.parse(text);
    metaCode = j?.error?.code;
    detail = j?.error?.message ?? j?.error_description ?? j?.message ?? j?.error?.code ?? detail;
  } catch { /* resposta não-JSON */ }
  throw new ApiError(`${label}: HTTP ${res.status} — ${detail}`, {
    auth: res.status === 401 || metaCode === 190,
    permanent: res.status === 400 || res.status === 403,
  });
}

export const form = (o: Record<string, string>) => new URLSearchParams(o);

/** Baixa um trecho do vídeo (bytes start..end inclusive) da URL assinada do Storage. */
export async function fetchRange(url: string, start: number, end: number): Promise<ArrayBuffer> {
  const res = await call('Leitura do vídeo', url, { headers: { Range: `bytes=${start}-${end}` } });
  const buf = await res.arrayBuffer();
  if (buf.byteLength !== end - start + 1) throw new ApiError(`Leitura do vídeo: esperado ${end - start + 1} bytes, recebido ${buf.byteLength}`);
  return buf;
}
