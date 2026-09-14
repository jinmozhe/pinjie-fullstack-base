import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const require = createRequire(import.meta.url);
const pnpmfile = require(resolve(root, ".pnpmfile.cjs"));
const readPackage = pnpmfile.hooks.readPackage;

const transformed = readPackage({
  name: "@umijs/preset-umi",
  version: "4.7.5",
  dependencies: {
    "@umijs/bundler-vite": "4.7.5",
    "@umijs/bundler-webpack": "4.7.5",
  },
});
assert.equal(transformed.dependencies["@umijs/bundler-vite"], undefined);
assert.equal(transformed.dependencies["@umijs/bundler-webpack"], "4.7.5");
assert.throws(
  () => readPackage({ name: "@umijs/preset-umi", version: "4.7.6", dependencies: {} }),
  /Re-evaluate the Webpack-only security patch/,
);

const lockfile = await readFile(resolve(root, "pnpm-lock.yaml"), "utf8");
for (const forbidden of ["'@umijs/bundler-vite@4.7.5':", "vite@4.5.2:"]) {
  assert.equal(lockfile.includes(forbidden), false, `Forbidden dependency remains in pnpm-lock.yaml: ${forbidden}`);
}
assert.equal(lockfile.includes("vite@6.4.3:"), true, "The supported Vitest Vite version is missing");

const patch = await readFile(resolve(root, "patches", "@umijs__preset-umi@4.7.5.patch"), "utf8");
assert.match(patch, /Umi Vite bundler is disabled because its supported Vite version has known High vulnerabilities/);
assert.match(patch, /-var import_schema = require\("@umijs\/bundler-vite\/dist\/schema"\);/);
assert.match(patch, /-var bundlerVite = .*"@umijs\/bundler-vite"/);

const webpackPatch = await readFile(resolve(root, "patches", "@umijs__bundler-webpack@4.7.5.patch"), "utf8");
assert.match(webpackPatch, /server\.listen\(port, opts\.host/);

const expectedSecurePackages = [
  "decode-uri-component@0.5.0:",
  "qs@6.16.0:",
  "hono@4.13.5:",
  "colord@2.9.4:",
  "vitest@4.1.11:",
  "'@vitest/coverage-v8@4.1.11(vitest@4.1.11)':",
];
for (const packageEntry of expectedSecurePackages) {
  assert.equal(lockfile.includes(packageEntry), true, `Secure package version is missing: ${packageEntry}`);
}
for (const vulnerablePackageEntry of ["decode-uri-component@0.2.2:", "qs@6.15.3:", "hono@4.13.1:", "colord@2.9.3:"]) {
  assert.equal(lockfile.includes(vulnerablePackageEntry), false, `Vulnerable package remains in pnpm-lock.yaml: ${vulnerablePackageEntry}`);
}

const queryStringPatch = await readFile(resolve(root, "patches", "query-string@6.14.1.patch"), "utf8");
assert.match(queryStringPatch, /require\('\.\/decode-uri-component\.cjs'\)/);
assert.match(queryStringPatch, /new file mode 100644/);
assert.match(queryStringPatch, /module\.exports = function decodeUriComponent/);

const adminRequire = createRequire(resolve(root, "apps", "admin", "package.json"));
const maxRequire = createRequire(adminRequire.resolve("@umijs/max/package.json"));
const umiRequire = createRequire(maxRequire.resolve("umi/package.json"));
const presetUmiRequire = createRequire(umiRequire.resolve("@umijs/preset-umi/package.json"));
const historyRequire = createRequire(presetUmiRequire.resolve("@umijs/history/package.json"));
const queryStringPath = historyRequire.resolve("query-string");
assert.match(queryStringPath, /query-string@6\.14\.1_patch_/);
const queryString = historyRequire("query-string");
const parsedQuery = queryString.parse("name=%E4%B8%AD%E6%96%87&bad=%E0%A4%A");
assert.equal(parsedQuery.name, "中文");
assert.equal(parsedQuery.bad, "%E0%A4%A");
const malformedInput = "%E0%A4%A".repeat(5000);
const decodingStartedAt = Date.now();
queryString.parse(`value=${malformedInput}`);
assert.ok(Date.now() - decodingStartedAt < 1500, "Patched decoder exceeded the malformed-input time limit");

process.stdout.write("Umi Webpack-only dependency and loopback policies passed.\n");
