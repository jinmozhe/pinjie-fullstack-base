import { pinjieConfig } from "@pinjie/eslint-config";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat();

export default [
  ...pinjieConfig,
  // Next.js 特定规则（Core Web Vitals 等）
  ...compat.extends("next/core-web-vitals"),
];
