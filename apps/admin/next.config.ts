import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["100.126.224.78", "100.86.180.92"],
  transpilePackages: ["@c3/ui", "@c3/auth", "@c3/supabase", "@c3/utils", "@c3/types", "@c3/qr"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nsjrzxbtxsqmsdgevszv.supabase.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.cdninstagram.com",
      },
      {
        protocol: "https",
        hostname: "**.fbcdn.net",
      },
    ],
  },
};
export default nextConfig;
