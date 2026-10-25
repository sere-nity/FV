# fanvue-curator

Creator planning and curation app for Fanvue, built as an **on-platform** (embedded) app: Fanvue loads it in an iframe on the creator's App Home and signs the creator in with a one-time session token, so there is no login screen. Next.js App Router + [`@fanvue/builder-sdk`](https://api.fanvue.com/docs/app-store/sdk/overview). Currently: the signed-in creator's profile.

Requires Node 18+, pnpm, and a KYC-verified Fanvue creator account with the On-platform app type available ([Choose your app type](https://api.fanvue.com/docs/get-started/choose-your-app-type)).

## How sign-in works

1. Fanvue opens the creator surface URL as `https://<host>/embedded?token=<one-time session token>&theme=<light|dark>`.
2. `useEmbeddedAuth()` (`src/app/embedded/page.tsx`) posts the token to `POST /api/fanvue/session`.
3. That route (`createSessionExchangeHandler`) runs the authorize-on-behalf + PKCE exchange server-side with the client secret, and returns a session JWT signed with `SESSION_SECRET`. The browser keeps it in `sessionStorage` (`fanvue:jwt`).
4. The page calls `GET /api/me` via `authFetch` (`Authorization: Bearer <jwt>`). The route verifies the JWT with `getAuthenticatedClient`, refreshes tokens near expiry (returned as `X-Updated-Session`), and calls `GET /users/me`.

The session token is single-use and short-lived. If the exchange returns `invalid_session_token`, reopen the app from Fanvue. If it returns `consent_required`, the creator still has to approve the app in Fanvue.

| Route | Purpose |
| --- | --- |
| `/embedded` | Creator surface. This is the URL Fanvue iframes. |
| `/` | Redirects to `/embedded`, keeping the query string. |
| `POST /api/fanvue/session` | Session-token exchange (SDK). |
| `GET /api/me` | Creator profile (Bearer session). |
| `/api/oauth/callback` | Registered redirect URI placeholder. The token exchange sends it but no browser visits it. Don't delete it. |

## 1. Configure the app in the Developer Area

1. At [fanvue.com/developers/apps](https://fanvue.com/developers/apps), click **Create app** and save the **Client ID** and **Client Secret** (the secret is shown once; if lost, use **Reset secret** on the Authentication tab).
2. **App details → App type:** choose **On-platform** ("Your app loads inside Fanvue", stored as `embedded`).
3. **App details → Embed settings → creator landing URL:**
   - local: `https://fanvue-curator.dev:3001/embedded`
   - deployed: `https://<your-domain>/embedded`

   Saving embed settings removes any App URL from the earlier off-platform setup.
4. **Authentication tab:** the **first** redirect URI must equal `OAUTH_REDIRECT_URI`, e.g. `https://fanvue-curator.dev:3001/api/oauth/callback`. Tick the scopes the app needs (`read:self`). Embedded tokens carry the scopes registered here plus `openid offline_access`. `OAUTH_SCOPES` is not used.
5. To list the app: set **App domain**, complete the listing, and **Submit for review**.

You can configure the same thing with an [App Manifest](https://api.fanvue.com/docs/app-store/embedded-apps/integration-guide) served at `https://<domain>/app-manifest.json` (`access.type: "embedded"`, `access.url: "https://<domain>/embedded"`, `oauth.redirectUris[0]` = `OAUTH_REDIRECT_URI`). This repo doesn't ship one, because it needs a domain you control.

## 2. Configure env

```bash
cp .env.example .env.local
openssl rand -hex 32   # paste as SESSION_SECRET
```

| Variable | Required | Notes |
| --- | --- | --- |
| `OAUTH_CLIENT_ID` | yes | From Create app. |
| `OAUTH_CLIENT_SECRET` | yes | Server-only. Never expose it to the client. |
| `OAUTH_REDIRECT_URI` | yes | Must equal the first registered redirect URI, or the exchange fails. |
| `SESSION_SECRET` | yes | At least 32 characters. Signs the session JWT. |
| `FANVUE_PLATFORM_URL` | no | Default `https://www.fanvue.com` (dev: `https://dev.fanvue.com`). |
| `OAUTH_ISSUER_BASE_URL` | no | Default `https://auth.fanvue.com` (dev: `https://auth.dev.fanvue.com`). |
| `API_BASE_URL` | no | Default `https://api.fanvue.com` (dev: `https://api.dev.fanvue.com`). |

The SDK reads these values at request time, so `pnpm build` works without them.

## 3. Local HTTPS (one-time)

Fanvue only frames pages served over `https` with a browser-trusted certificate.

```bash
brew install mkcert
mkcert -install
mkcert fanvue-curator.dev            # run in the project root; writes *.pem (gitignored)
echo "127.0.0.1 fanvue-curator.dev" | sudo tee -a /etc/hosts
```

## 4. Run and test

```bash
pnpm install
pnpm dev        # terminal 1: Next.js on :3000
pnpm proxy      # terminal 2: local-ssl-proxy :3001 -> :3000
```

- **Inside Fanvue (the real path):** with Embed settings pointing at `https://fanvue-curator.dev:3001/embedded`, open the app from your App Home in Fanvue, on the same machine. The iframe loads your local server, exchanges the token, and shows your profile.
- **Standalone:** opening `https://fanvue-curator.dev:3001/embedded` directly shows "Open this app from Fanvue", because there is no session token outside Fanvue. Reloading inside the iframe reuses the stored session JWT.

### Alternative: portless (no mkcert, hosts file or proxy)

```bash
npm install -g portless
portless fanvue-curator next dev    # serves https://fanvue-curator.localhost
```

Then use `https://fanvue-curator.localhost/embedded` as the creator landing URL, `https://fanvue-curator.localhost/api/oauth/callback` as the redirect URI (portal and `OAUTH_REDIRECT_URI`), and add the host to `allowedDevOrigins` in `next.config.ts`.

## Headers / CSP

`next.config.ts` sets the headers from the integration guide's [Hosting](https://api.fanvue.com/docs/app-store/embedded-apps/integration-guide) table, which is what `withFanvueHeaders()` produces:

- On all paths: `Content-Security-Policy: frame-ancestors 'self' https://fanvue.com https://*.fanvue.com`, HSTS, `Referrer-Policy`, `X-Content-Type-Options: nosniff`, and a `Permissions-Policy` that disables camera, microphone, geolocation and payment.
- On `/api/*`: CORS headers (`*` origin, `Authorization`/`Content-Type` allowed, `WWW-Authenticate` exposed). A wildcard origin is safe here because the session travels in `Authorization`, not in a cookie.

The rules are written out instead of importing `withFanvueHeaders`, because `@fanvue/builder-sdk` (0.8–0.10) can't be loaded from a Next config file. Next compiles `next.config.ts` to CommonJS, and the package only ships an `import` export. As `next.config.mjs`, Node can't resolve the SDK's extensionless `next/server` import. Keep the rules in sync with the docs table.

The iframe sandbox blocks `alert`/`confirm`/`prompt` and downloads; popups and forms work.

## Troubleshooting

- **Iframe shows "refused to connect"**: check the response's `Content-Security-Policy` includes `frame-ancestors … https://*.fanvue.com`, and that the certificate is trusted (`mkcert -install`).
- **`invalid_session_token`**: the token expired or was already used. Reopen the app from Fanvue.
- **`consent_required`**: the creator hasn't approved the app yet.
- **`exchange_failed`**: usually `OAUTH_REDIRECT_URI` differs from the first registered redirect URI, or the client ID/secret is wrong.
- **Proxy connection refused**: start `pnpm dev` before `pnpm proxy`.

Docs: [On-platform integration guide](https://api.fanvue.com/docs/app-store/embedded-apps/integration-guide), [Embedded SDK](https://api.fanvue.com/docs/app-store/sdk/embedded), [API reference](https://api.fanvue.com/docs).
