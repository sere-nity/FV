import { createSessionExchangeHandler } from "@fanvue/builder-sdk/nextjs/embedded-app";
import { getConfig } from "@/lib/fanvue";

export async function POST(request: Request) {
  return createSessionExchangeHandler(getConfig()).POST(request);
}
