# fanvue-curator

Creator planning and curation app for Fanvue. Next.js App Router, bootstrapped from the [Fanvue App Starter](https://github.com/fanvue/fanvue-app-starter). Currently: Sign in with Fanvue (OAuth 2.0 + PKCE) and the signed-in creator's profile.

Requires Node 18+, pnpm, and a KYC-verified Fanvue creator account (only verified creators can create apps).

## 1. Create the Fanvue app

1. Go to [fanvue.com/developers/apps](https://fanvue.com/developers/apps) and click **Create app**.
2. Copy the **Client ID** and **Client Secret** from the dialog. The secret is shown once (if lost: **Reset secret** on the Authentication tab).
3. On the **Authentication** tab, add the redirect URI and tick `read:self`, then save:

```
https://fanvue-curator.dev:3001/api/oauth/callback
```

## 2. Configure env

```bash
cp .env.example .env.local
openssl rand -hex 32   # paste as SESSION_SECRET
```

Fill in `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET` and `SESSION_SECRET`. `OAUTH_SCOPES` must only list scopes ticked on the Authentication tab (`read:self` for now). `OAUTH_REDIRECT_URI` must match the portal exactly.

## 3. Local HTTPS (one-time)

```bash
brew install mkcert
mkcert -install
mkcert fanvue-curator.dev            # run in the project root; writes *.pem (gitignored)
echo "127.0.0.1 fanvue-curator.dev" | sudo tee -a /etc/hosts
```

## 4. Run

```bash
pnpm install
pnpm dev        # terminal 1: Next.js on :3000
pnpm proxy      # terminal 2: local-ssl-proxy :3001 -> :3000
```

Open https://fanvue-curator.dev:3001, click **Login with Fanvue**, approve, and your profile (name, handle, counts) shows.

### Alternative: portless (no mkcert, hosts file or proxy)

```bash
npm install -g portless
portless fanvue-curator next dev    # serves https://fanvue-curator.localhost
```

Then use `https://fanvue-curator.localhost/api/oauth/callback` as the redirect URI (portal and `OAUTH_REDIRECT_URI`) and `BASE_URL=https://fanvue-curator.localhost`.

## Build

`pnpm build` validates env, so it needs `.env.local` filled in. To build without it: `SKIP_ENV_VALIDATION=1 pnpm build`.

## Troubleshooting

- **Invalid redirect URI**: `OAUTH_REDIRECT_URI` must match the portal exactly, including `https://` and `:3001`.
- **Scope error**: every scope in `OAUTH_SCOPES` must be ticked in the portal. Adding scopes later (`read:chat write:chat read:fan`) makes users re-authorise.
- **Certificate warning**: re-run `mkcert -install`.
- **Proxy connection refused**: start `pnpm dev` before `pnpm proxy`.

Docs: [Fanvue quick start](https://api.fanvue.com/docs/introduction/quick-start), [API reference](https://api.fanvue.com/docs).
