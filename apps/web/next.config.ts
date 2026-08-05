import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kananos/database"],
  serverExternalPackages: ["postgres"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; img-src 'self' data: https:; script-src 'none'; style-src 'unsafe-inline';",
  },
};

export default nextConfig;
