import { pinjieConfig } from "@pinjie/eslint-config";
import nextPlugin from "@next/eslint-plugin-next";

export default [
  ...pinjieConfig,
  {
    languageOptions: {
      globals: {
        Request: "readonly",
        URL: "readonly",
        fetch: "readonly",
        process: "readonly",
        window: "readonly",
      },
    },
  },
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
];
