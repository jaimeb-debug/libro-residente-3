import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://udz3c.es https://www.udz3c.es;"
          },
          {
            key: "X-Frame-Options",
            value: "ALLOW-FROM https://www.udz3c.es"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
