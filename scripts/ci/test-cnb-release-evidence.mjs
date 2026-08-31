import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const guardScript = path.join(scriptDirectory, "check-cnb-release-evidence.mjs");
const fixtureRoot = await mkdtemp(path.join(tmpdir(), "pinjie-cnb-release-evidence-"));
const manifestPath = path.join(fixtureRoot, "release-manifest.json");
const expectedCommit = "a".repeat(40);
const expectedBuildId = "987654321";
const digest = `sha256:${"b".repeat(64)}`;

function image(repository) {
  return {
    repository,
    digest,
    reference: `ccr.ccs.tencentyun.com/pinjie-fullstack-base/${repository}@${digest}`,
    immutable_tag: `sha-${expectedCommit}`,
    trivy: "passed",
    sbom: "cyclonedx-json",
    provenance: "buildkit-max",
  };
}

const validManifest = {
  schema: "pinjie-cnb-tcr-release-v1",
  commit_sha: expectedCommit,
  cnb: {
    repository: "pjwl/pinjie-fullstack-base",
    branch: "main",
    build_id: expectedBuildId,
    build_url: `https://cnb.cool/pjwl/pinjie-fullstack-base/-/build/logs/${expectedBuildId}`,
    started_at: "2026-08-31T01:00:00.000Z",
    finished_at: "2026-08-31T01:10:00.000Z",
  },
  registry: "ccr.ccs.tencentyun.com",
  namespace: "pinjie-fullstack-base",
  images: {
    backend: image("pinjie-fullstack-backend"),
    web: image("pinjie-fullstack-web"),
    admin: image("pinjie-fullstack-admin"),
  },
};

async function runGuard(manifest) {
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return spawnSync(
    process.execPath,
    [
      guardScript,
      "--manifest",
      manifestPath,
      "--expected-commit",
      expectedCommit,
      "--expected-build-id",
      expectedBuildId,
    ],
    { encoding: "utf8" },
  );
}

async function expectRejected(label, mutate) {
  const fixture = structuredClone(validManifest);
  mutate(fixture);
  const result = await runGuard(fixture);
  if (result.status === 0) {
    throw new Error(`Expected release evidence guard to reject ${label}.`);
  }
}

try {
  const validResult = await runGuard(validManifest);
  if (validResult.status !== 0) {
    throw new Error(`Expected valid release evidence to pass: ${validResult.stderr}`);
  }

  await expectRejected("wrong commit SHA", (fixture) => {
    fixture.commit_sha = "c".repeat(40);
  });
  await expectRejected("wrong build ID", (fixture) => {
    fixture.cnb.build_id = "123";
  });
  await expectRejected("missing image", (fixture) => {
    delete fixture.images.admin;
  });
  await expectRejected("unexpected field", (fixture) => {
    fixture.result = "success";
  });
  await expectRejected("digest mismatch", (fixture) => {
    fixture.images.backend.digest = `sha256:${"d".repeat(64)}`;
  });
  await expectRejected("failed scan", (fixture) => {
    fixture.images.web.trivy = "failed";
  });

  console.log("CNB release evidence guard fixtures passed.");
} finally {
  await rm(fixtureRoot, { recursive: true, force: true });
}
