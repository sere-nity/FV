import { env } from "@/env";
import { getSession, setSession } from "@/lib/session";
import { refreshAccessToken } from "@/lib/oauth";

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

export async function getCurrentUser(): Promise<FanvueUser | null> {
  let session = await getSession();
  if (!session) return null;

  if (Date.now() >= session.expiresAt - 30_000 && session.refreshToken) {
    try {
      const refreshed = await refreshAccessToken(session.refreshToken);
      const updatedSession = {
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token ?? session.refreshToken,
        tokenType: refreshed.token_type,
        scope: refreshed.scope ?? session.scope,
        expiresAt: Date.now() + refreshed.expires_in * 1000,
      };
      await setSession(updatedSession);
      session = updatedSession;
    } catch {}
  }

  try {
    const res = await fetch(`${env.API_BASE_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Fanvue-API-Version": "2025-06-26",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.log("error", error);
    return null;
  }
}
