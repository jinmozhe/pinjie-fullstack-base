import { pinjieConfig } from "@pinjie/eslint-config";

export default [
  ...pinjieConfig,
  {
    languageOptions: {
      globals: {
        document: "readonly",
        process: "readonly",
        window: "readonly",
      },
    },
  },
];
