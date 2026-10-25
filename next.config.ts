import type { NextConfig } from "next";

// Same rules as withFanvueHeaders() from @fanvue/builder-sdk/nextjs/embedded-app
// (see "Hosting" in the on-platform integration guide). The SDK helper can't be
// imported here: the package is ESM-only with an extensionless `next/server`
// import, so neither the CommonJS nor the native-ESM config loader can resolve it.
const FANVUE_FRAME_ANCESTORS = "frame-ancestors 'self' https://fanvue.com https://*.fanvue.com";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["fanvue-curator.dev"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: FANVUE_FRAME_ANCESTORS },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, PATCH, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Authorization, Content-Type" },
          { key: "Access-Control-Expose-Headers", value: "WWW-Authenticate" },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
