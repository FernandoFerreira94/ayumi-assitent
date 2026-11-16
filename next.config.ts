import type { NextConfig } from "next";

// Identifica esta versão do app: o navegador compara com /api/version para saber se há atualização.
const BUILD_ID = process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GITHUB_SHA || `local-${Date.now()}`;

// Política de conteúdo: começa só em relatório (Report-Only) para não quebrar nada; depois de uma semana
// sem violações no console/Sentry, trocar a chave para Content-Security-Policy.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https://*.googleusercontent.com",
  "connect-src 'self' https://*.sentry.io https://api.bigdatacloud.net",
  "worker-src 'self'",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  { key: "Content-Security-Policy-Report-Only", value: CSP },
];

// Painel do dono: nunca em cache, nunca indexado e sem mandar o endereço para outro site (somam aos de cima).
const ADMIN_HEADERS = [
  { key: "Cache-Control", value: "no-store" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
  { key: "Referrer-Policy", value: "no-referrer" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      { source: "/admin", headers: ADMIN_HEADERS },
      { source: "/admin/:path*", headers: ADMIN_HEADERS },
    ];
  },
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
