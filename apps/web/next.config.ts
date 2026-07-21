import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kananos/database", "@kananos/validations"],
  serverExternalPackages: ["postgres"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
    ],
  },
};

export default nextConfig;
