import { verifySessionJwt } from "@fanvue/builder-sdk";
import {
  createConfig,
  getAuthenticatedClient,
  getSession,
  type EmbeddedAppConfig,
} from "@fanvue/builder-sdk/nextjs/embedded-app";

export type FanvueUser = {
  uuid: string;
  email?: string;
  handle: string;
  displayName?: string;
  bio?: string;
  isCreator?: boolean;
  avatarUrl?: string | null;
  fanCounts?: { followersCount?: number; subscribersCount?: number };
  contentCounts?: { postCount?: number };
};

// Resolved lazily: createConfig() throws when OAUTH_*/SESSION_SECRET are unset,
// which would otherwise break `next build` while collecting route data.
let config: EmbeddedAppConfig | null = null;
export function getConfig() {
  config ??= createConfig();
  return config;
}

/**
 * Verifies the Bearer session JWT (refreshing tokens when near expiry) and
 * returns the creator's access token plus any re-signed JWT for X-Updated-Session.
 */
export async function getAccessToken() {
  const cfg = getConfig();
  const auth = await getAuthenticatedClient({ sessionSecret: cfg.sessionSecret, config: cfg });
  if (!auth) return null;

  const session = auth.refreshedJwt
    ? await verifySessionJwt(cfg.sessionSecret, auth.refreshedJwt).then((r) =>
        r.isOk() ? r.value : null,
      )
    : await getSession(cfg.sessionSecret);
  if (!session) return null;

  return { accessToken: session.accessToken, refreshedJwt: auth.refreshedJwt };
}

// The SDK's getCurrentUser() strips the profile down to identity fields, so the
// full /users/me payload (bio, counts) is fetched directly.
export async function fetchCurrentUser(accessToken: string): Promise<FanvueUser | null> {
  const base = (process.env.API_BASE_URL ?? "https://api.fanvue.com").replace(/\/+$/, "");
  const res = await fetch(`${base}/users/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Fanvue-API-Version": "2025-06-26",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}
