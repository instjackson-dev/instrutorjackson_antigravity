# Agendador de Vídeos — Instrutor Jackson

App próprio para **postar e agendar vídeos** no YouTube, TikTok, Instagram, Facebook e LinkedIn a partir de uma tela só.

- **Tela (React + Vite)** — `web/`: você sobe o vídeo, escreve a legenda (geral ou por rede), escolhe data/hora e marca as redes.
- **Servidor (Supabase)** — `supabase/`: banco, armazenamento do vídeo, login nas redes (OAuth) e o **publicador**, que roda sozinho a cada minuto.

```
Você (navegador) ──► Supabase Storage (vídeo) + tabela posts
                                    │
            cron a cada 1 min ──► função "publisher" ──► YouTube / TikTok / Instagram / Facebook / LinkedIn
```

Cada rede tem etapas diferentes (Instagram e TikTok processam o vídeo antes de publicar). O publicador guarda a etapa e continua na rodada seguinte; falhas temporárias são repetidas até 3 vezes. Quando tudo é publicado, o vídeo é apagado do armazenamento.

---

## 1. Supabase

1. Crie um projeto em <https://supabase.com> (o plano grátis serve; o limite de vídeo é **50 MB**. No plano Pro dá para subir esse limite em *Storage > Settings*).
2. Instale a CLI e vincule: `npx supabase login` e `npx supabase link --project-ref SEU-REF` (rode dentro de `agendador/`).
3. Crie as tabelas: `npx supabase db push` (aplica `migrations/…_init.sql` e `…_cron.sql`).
   - Depois, no **SQL Editor**, crie os dois segredos que o cron usa (comandos no topo de `…_cron.sql`). O cron lê esses segredos a cada execução, então a ordem não importa.
4. **Authentication > Providers > Email**: desligue *Allow new users to sign up* e crie o seu usuário em *Authentication > Users > Add user*. Só você entra no app.

## 2. Apps de desenvolvedor de cada rede

Em todas use a mesma **URL de redirecionamento**:

```
https://SEU-REF.supabase.co/functions/v1/oauth-callback
```

| Rede | Onde criar | O que ativar | Segredos |
|---|---|---|---|
| **YouTube** | [Google Cloud Console](https://console.cloud.google.com/) → novo projeto → ative *YouTube Data API v3* → *Tela de consentimento OAuth* → *Credenciais > ID do cliente OAuth (Aplicativo da Web)* | Escopos `youtube.upload` e `youtube.readonly`. Enquanto o app não for **verificado pelo Google**, os vídeos ficam **privados**; adicione seu e-mail em *Usuários de teste*. | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| **Facebook + Instagram** | [Meta for Developers](https://developers.facebook.com/apps) → app tipo *Empresa* → produto *Login do Facebook para Empresas* | Permissões `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`, `business_management`. O Instagram precisa ser **Profissional** e **ligado à Página**. Em modo desenvolvimento funciona para você (admin do app); para modo *Ao vivo* a Meta exige **Revisão do app**. | `META_APP_ID`, `META_APP_SECRET` |
| **TikTok** | [TikTok for Developers](https://developers.tiktok.com/) → app → produtos *Login Kit* e *Content Posting API* (com *Direct Post*) | Escopos `user.info.basic`, `video.publish`. Até passar na **auditoria do TikTok**, os vídeos só saem como **privados (SELF_ONLY)**. | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` |
| **LinkedIn** | [LinkedIn Developers](https://www.linkedin.com/developers/apps) → app (precisa de uma Página da empresa vinculada) → produtos *Sign In with LinkedIn using OpenID Connect* e *Share on LinkedIn* | Publica no **perfil pessoal**. O token vale **60 dias**: o app avisa e você clica em *Reconectar*. | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` |

## 3. Segredos e funções

```bash
cd agendador
npx supabase secrets set \
  APP_URL=https://SEU-APP.vercel.app \
  CRON_SECRET=$(openssl rand -hex 24) \
  GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... \
  META_APP_ID=... META_APP_SECRET=... \
  TIKTOK_CLIENT_KEY=... TIKTOK_CLIENT_SECRET=... \
  LINKEDIN_CLIENT_ID=... LINKEDIN_CLIENT_SECRET=...

npx supabase functions deploy oauth-start
npx supabase functions deploy oauth-callback --no-verify-jwt
npx supabase functions deploy publisher --no-verify-jwt
```

Use o **mesmo valor de `CRON_SECRET`** no segredo `cron_secret` do Vault (passo 1.3).

Opcionais: `YOUTUBE_PRIVACY` (`public` | `unlisted` | `private`, padrão `public`), `TIKTOK_PRIVACY` (padrão `SELF_ONLY`; troque para `PUBLIC_TO_EVERYONE` depois da auditoria), `META_GRAPH_VERSION` (padrão `v21.0`), `LINKEDIN_VERSION` (padrão `202510`, formato AAAAMM; o LinkedIn aceita versões de até ~1 ano).

## 4. Tela (Vercel)

```bash
cd agendador/web
cp .env.example .env   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm install
npm run dev            # testar em http://localhost:5173
```

Na Vercel: *Add New Project* → este repositório → **Root Directory: `agendador/web`** → variáveis `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_MAX_MB`.

## 5. Uso

1. **Contas** → conecte YouTube, Facebook + Instagram, TikTok e LinkedIn.
2. **Agendar** → escolha o vídeo, título, legenda (ou uma legenda por rede), marque as redes, defina data/hora → *Agendar* ou *Publicar agora*.
3. **Fila** → acompanhe cada rede (Aguardando → Processando → Publicado), veja o link do post, cancele ou tente de novo.

## Formato recomendado do vídeo

MP4 (H.264 + AAC), vertical **9:16 (1080×1920)**, entre 5 s e 90 s. Esse formato é aceito como Reels, Shorts e TikTok ao mesmo tempo.

## Segurança

- Os tokens das redes ficam na tabela `account_tokens`, sem acesso pelo navegador (só o servidor lê).
- Os vídeos ficam em armazenamento privado. As redes recebem um link temporário.
- O login OAuth usa `state` de uso único que expira em 15 minutos.
