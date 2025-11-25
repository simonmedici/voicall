import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "https://17a9ae5a-abee-4fe8-86d6-4a9056cbd438-00-3hktak2g3706y.riker.replit.dev",
    "http://127.0.0.1:5000",
    "http://localhost:5000",
    "http://127.0.0.1",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://elevenlabs.io https://*.elevenlabs.io https://cdn.elevenlabs.io https://unpkg.com blob:",
              "worker-src 'self' https://elevenlabs.io https://*.elevenlabs.io https://cdn.elevenlabs.io blob:",
              "connect-src 'self' https://*.elevenlabs.io https://api.elevenlabs.io wss://*.elevenlabs.io wss://api.elevenlabs.io",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "media-src 'self' blob:",
              "frame-src 'self'",
            ].join("; "),
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, X-Requested-With" },
        ],
      },
    ];
  },
};

export default nextConfig;
