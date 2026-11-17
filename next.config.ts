import type { NextConfig } from "next";

const isExport = process.env.NEXT_EXPORT === 'true';

const nextConfig: NextConfig = {
  output: isExport ? "export" : "standalone",
  ...(isExport ? {} : { cacheComponents: true, partialPrefetching: true }),
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
