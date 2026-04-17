import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

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

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    authInterrupts: true,
    viewTransition: true,
  },
  serverExternalPackages: ["pino", "pino-pretty"],
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    minimumCacheTTL: 60,
  },
  async headers() {
    return [
      {
        source: "/:path*{/}?",
        headers: [
          {
            key: "X-Accel-Buffering",
            value: "no",
          },
        ],
      },
    ];
  },
  logging: {
    incomingRequests: {
      ignore: [/\/manifest\.webmanifest$/, /\api\/health/],
    },
    browserToTerminal: "error",
  },
  output: "standalone",
};

export default withNextIntl(nextConfig);
