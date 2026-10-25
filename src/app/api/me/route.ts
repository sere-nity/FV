import { NextResponse } from "next/server";
import { HEADER_UPDATED_SESSION } from "@fanvue/builder-sdk";
import { fetchCurrentUser, getAccessToken } from "@/lib/fanvue";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getAccessToken();
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await fetchCurrentUser(auth.accessToken);
  const res = user
    ? NextResponse.json(user)
    : NextResponse.json({ error: "api_failed" }, { status: 502 });
  if (auth.refreshedJwt) res.headers.set(HEADER_UPDATED_SESSION, auth.refreshedJwt);
  return res;
}
