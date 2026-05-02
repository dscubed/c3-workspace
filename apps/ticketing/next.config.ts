import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@c3/ui", "@c3/auth", "@c3/supabase", "@c3/utils", "@c3/types"],
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
