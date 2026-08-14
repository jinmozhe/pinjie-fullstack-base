import { pinjieConfig } from "@pinjie/eslint-config";

export default [
  { ignores: ["coverage/**", "dist/**"] },
  ...pinjieConfig,
  {
    languageOptions: {
      globals: {
        document: "readonly",
        fetch: "readonly",
        Headers: "readonly",
        process: "readonly",
        RequestInit: "readonly",
        Response: "readonly",
        URLSearchParams: "readonly",
        window: "readonly",
      },
    },
  },
];
