import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { fileURLToPath } from "node:url";

const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: [
      "./src/messages/common.en.json",
      "./src/messages/features/accounts.en.json",
      "./src/messages/features/workspaces.en.json",
      "./src/messages/features/application.en.json",
      "./src/messages/features/dashboard.en.json",
    ],
  },
});

const securityHeaders = [
  {
    key: "X-Accel-Buffering",
    value: "no",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'",
  },
  ...(process.env.NODE_ENV === "production"
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ]
    : []),
];

const dataCacheHandlerPath = fileURLToPath(
  new URL("./src/server/cache/cache.mjs", import.meta.url)
);
const isrCacheHandlerPath = fileURLToPath(
  new URL("./src/server/cache/isr-cache.mjs", import.meta.url)
);

const nextConfig: NextConfig = {
  cacheComponents: true,

  cacheHandler: isrCacheHandlerPath,
  cacheHandlers: {
    default: dataCacheHandlerPath,
    remote: dataCacheHandlerPath,
  },
  cacheMaxMemorySize: 0, // Disable Next's built-in in-memory handler

  experimental: {
    authInterrupts: true,
    viewTransition: true,
  },
  serverExternalPackages: ["pino", "pino-pretty"],
  reactCompiler: true,
  images: {
    remotePatterns: [],
    minimumCacheTTL: 60,
  },
  async headers() {
    return [
      {
        source: "/:path*{/}?",
        headers: securityHeaders,
      },
    ];
  },
  logging: {
    incomingRequests: {
      ignore: [/\/manifest\.webmanifest$/, /\/api\/health/],
    },
    browserToTerminal: "error",
  },
  output: "standalone",
};

export default withNextIntl(nextConfig);
