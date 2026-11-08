import type { NextConfig } from "next";

// Identifica esta versão do app: o navegador compara com /api/version para saber se há atualização.
const BUILD_ID = process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GITHUB_SHA || `local-${Date.now()}`;

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_BUILD_ID: BUILD_ID },
  cacheComponents: true,
  partialPrefetching: true,
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
