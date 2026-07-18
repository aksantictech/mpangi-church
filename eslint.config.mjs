import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    name: "mpangi-church/stabilisation",
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },

  {
    name: "mpangi-church/commonjs-scripts",
    files: [
      "scripts/**/*.js",
      "check-*.js",
      "patch-*.js",
    ],
    rules: {
      // Les scripts techniques Node.js utilisent volontairement CommonJS.
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    "**/*.bak",
    "**/*.backup.*",
    "**/*.deprecated.*",
    "patches/**",
    "templates/**",
    ".phase*-backup/**",
  ]),
]);

export default eslintConfig;