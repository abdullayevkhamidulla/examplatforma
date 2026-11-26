import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Dev rejimida bir tarmoqdagi boshqa qurilmalar (telefonlar) ham ishlata olishi uchun
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
