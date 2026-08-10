import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Floor plan + several vacant-room photos in one multipart submit
      // easily exceed the 1MB default.
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
