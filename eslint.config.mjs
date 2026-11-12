import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Toast só pelo notify (src/components/feedback/toast.tsx): é ele que põe a Bolha certa em cada tipo
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/feedback/toast.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        { paths: [{ name: "sonner", message: "Use notify de @/components/feedback/toast." }] },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
