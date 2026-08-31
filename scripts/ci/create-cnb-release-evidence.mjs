import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const imageDefinitions = {
  backend: "pinjie-fullstack-backend",
  web: "pinjie-fullstack-web",
  admin: "pinjie-fullstack-admin",
};

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is missing.`);
  }
  return value;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function hasBlockingVulnerability(report) {
  if (!Array.isArray(report.Results)) {
    throw new Error("Trivy report does not contain a Results array.");
  }
  return report.Results.some((result) =>
    (result.Vulnerabilities ?? []).some((vulnerability) =>
      ["HIGH", "CRITICAL"].includes(vulnerability.Severity),
    ),
  );
}

const evidenceRoot = requiredEnv("EVIDENCE_ROOT");
const commitSha = requiredEnv("CNB_COMMIT");
const registry = requiredEnv("TCR_REGISTRY");
const namespace = requiredEnv("TCR_NAMESPACE");

if (!/^[0-9a-f]{40}$/.test(commitSha)) {
  throw new Error("CNB_COMMIT must be a full lowercase 40-character SHA.");
}
if (registry !== "ccr.ccs.tencentyun.com" || namespace !== "pinjie-fullstack-base") {
  throw new Error("TCR registry or namespace does not match the release boundary.");
}

const images = {};
for (const [key, repository] of Object.entries(imageDefinitions)) {
  const digest = (await readFile(path.join(evidenceRoot, `${key}-digest.txt`), "utf8")).trim();
  if (!/^sha256:[0-9a-f]{64}$/.test(digest)) {
    throw new Error(`Digest evidence for ${key} is invalid.`);
  }

  const trivy = await readJson(path.join(evidenceRoot, `${key}-trivy.json`));
  if (hasBlockingVulnerability(trivy)) {
    throw new Error(`Trivy evidence for ${key} contains a blocking vulnerability.`);
  }

  const sbom = await readJson(path.join(evidenceRoot, `${key}-sbom.cdx.json`));
  if (sbom.bomFormat !== "CycloneDX" || typeof sbom.specVersion !== "string") {
    throw new Error(`SBOM evidence for ${key} is not valid CycloneDX JSON.`);
  }

  const metadata = await readJson(path.join(evidenceRoot, `${key}-metadata.json`));
  if (metadata["containerimage.digest"] !== digest) {
    throw new Error(`Build metadata digest for ${key} does not match.`);
  }
  if (typeof metadata["buildx.build.provenance"]?.buildType !== "string") {
    throw new Error(`Build provenance metadata for ${key} is missing.`);
  }

  images[key] = {
    repository,
    digest,
    reference: `${registry}/${namespace}/${repository}@${digest}`,
    immutable_tag: `sha-${commitSha}`,
    trivy: "passed",
    sbom: "cyclonedx-json",
    provenance: "buildkit-max",
  };
}

const manifest = {
  schema: "pinjie-cnb-tcr-release-v1",
  commit_sha: commitSha,
  cnb: {
    repository: requiredEnv("CNB_REPO_SLUG"),
    branch: requiredEnv("CNB_BRANCH"),
    build_id: requiredEnv("CNB_BUILD_ID"),
    build_url: requiredEnv("CNB_BUILD_WEB_URL"),
    started_at: requiredEnv("CNB_BUILD_START_TIME"),
    finished_at: new Date().toISOString(),
  },
  registry,
  namespace,
  images,
};

await mkdir(evidenceRoot, { recursive: true });
await writeFile(
  path.join(evidenceRoot, "release-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);
