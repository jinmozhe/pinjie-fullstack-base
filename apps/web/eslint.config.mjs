import { pinjieConfig } from "@pinjie/eslint-config";
import nextPlugin from "@next/eslint-plugin-next";

export default [
  ...pinjieConfig,
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
