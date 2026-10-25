import { createOAuthCallbackPageHandler } from "@fanvue/builder-sdk/nextjs/embedded-app";

// Registered redirect URI (OAUTH_REDIRECT_URI). The embedded token exchange
// sends it server-to-server and must match; no browser is expected here.
export const GET = createOAuthCallbackPageHandler("fanvue-curator");
