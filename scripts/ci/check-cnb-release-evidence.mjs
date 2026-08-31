import { readFile } from "node:fs/promises";

const expectedImages = {
  backend: "pinjie-fullstack-backend",
  web: "pinjie-fullstack-web",
  admin: "pinjie-fullstack-admin",
};

function parseArguments(argv) {
  const result = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || !value) {
      throw new Error("Arguments must be provided as --name value pairs.");
    }
    if (result.has(key)) {
      throw new Error(`Duplicate argument ${key}.`);
    }
    result.set(key, value);
  }
  return result;
}

function exactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    throw new Error(`${label} fields do not match the schema.`);
  }
}

function requireEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} does not match.`);
  }
}

function requireTimestamp(value, label) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new Error(`${label} must be an ISO timestamp.`);
  }
}

const args = parseArguments(process.argv.slice(2));
const manifestPath = args.get("--manifest");
const expectedCommit = args.get("--expected-commit");
const expectedBuildId = args.get("--expected-build-id");

if (!manifestPath || !expectedBuildId || !/^[0-9a-f]{40}$/.test(expectedCommit ?? "")) {
  throw new Error("Manifest path, full commit SHA, and build ID are required.");
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
exactKeys(
  manifest,
  ["schema", "commit_sha", "cnb", "registry", "namespace", "images"],
  "Release manifest",
);
requireEqual(manifest.schema, "pinjie-cnb-tcr-release-v1", "Release schema");
requireEqual(manifest.commit_sha, expectedCommit, "Commit SHA");
requireEqual(manifest.registry, "ccr.ccs.tencentyun.com", "Registry");
requireEqual(manifest.namespace, "pinjie-fullstack-base", "Namespace");

exactKeys(
  manifest.cnb,
  ["repository", "branch", "build_id", "build_url", "started_at", "finished_at"],
  "CNB evidence",
);
requireEqual(manifest.cnb.repository, "pjwl/pinjie-fullstack-base", "CNB repository");
requireEqual(manifest.cnb.branch, "main", "CNB branch");
requireEqual(manifest.cnb.build_id, expectedBuildId, "CNB build ID");
requireTimestamp(manifest.cnb.started_at, "CNB start time");
requireTimestamp(manifest.cnb.finished_at, "CNB finish time");

const buildUrl = new URL(manifest.cnb.build_url);
requireEqual(buildUrl.origin, "https://cnb.cool", "CNB build URL origin");
if (!buildUrl.pathname.startsWith("/pjwl/pinjie-fullstack-base/-/build/")) {
  throw new Error("CNB build URL path does not match the repository.");
}

exactKeys(manifest.images, Object.keys(expectedImages), "Image evidence");
for (const [key, repository] of Object.entries(expectedImages)) {
  const image = manifest.images[key];
  exactKeys(
    image,
    ["repository", "digest", "reference", "immutable_tag", "trivy", "sbom", "provenance"],
    `${key} image evidence`,
  );
  requireEqual(image.repository, repository, `${key} repository`);
  if (!/^sha256:[0-9a-f]{64}$/.test(image.digest)) {
    throw new Error(`${key} digest is invalid.`);
  }
  requireEqual(
    image.reference,
    `ccr.ccs.tencentyun.com/pinjie-fullstack-base/${repository}@${image.digest}`,
    `${key} immutable reference`,
  );
  requireEqual(image.immutable_tag, `sha-${expectedCommit}`, `${key} immutable tag`);
  requireEqual(image.trivy, "passed", `${key} Trivy status`);
  requireEqual(image.sbom, "cyclonedx-json", `${key} SBOM status`);
  requireEqual(image.provenance, "buildkit-max", `${key} provenance status`);
}

console.log(`CNB release evidence matches commit ${expectedCommit} and build ${expectedBuildId}.`);
