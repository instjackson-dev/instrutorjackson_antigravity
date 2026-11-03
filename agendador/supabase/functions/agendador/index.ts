// Ponto único do servidor do Agendador (uma Edge Function, três rotas):
//   POST /agendador/oauth-start     — gera a URL de login da rede (exige login do app)
//   GET  /agendador/oauth-callback  — retorno do login das redes
//   POST /agendador/publisher       — chamado pelo cron a cada minuto (x-cron-secret)
import { cors, json } from '../_shared/core.ts';
import { oauthStart } from '../_shared/oauth_start.ts';
import { oauthCallback } from '../_shared/oauth_callback.ts';
import { publisher } from '../_shared/publisher.ts';

const ROUTES: Record<string, (req: Request) => Promise<Response>> = {
  'oauth-start': oauthStart,
  'oauth-callback': oauthCallback,
  publisher,
};

Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const route = new URL(req.url).pathname.split('/').filter(Boolean).pop() ?? '';
  const handler = ROUTES[route];
  return handler ? handler(req) : Promise.resolve(json({ error: 'Rota não encontrada' }, 404));
});
