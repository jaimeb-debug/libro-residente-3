import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://www.udz3c.es;"
          },
          {
            key: "X-Frame-Options",
            value: "ALLOW-FROM https://wwww.udz3c.es"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
