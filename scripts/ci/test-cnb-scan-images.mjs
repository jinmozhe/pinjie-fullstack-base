import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const scanScript = path.join(scriptDirectory, "cnb-scan-images.sh");
const fixtureRoot = mkdtempSync(path.join(process.cwd(), ".tmp-cnb-scan-"));
const mockBin = path.join(fixtureRoot, "bin");
const digest = `sha256:${"a".repeat(64)}`;

function resolveBashExecutable() {
  if (process.platform !== "win32") {
    return "bash";
  }
  const whereResult = spawnSync("where.exe", ["git.exe"], { encoding: "utf8" });
  const gitExecutable = whereResult.stdout?.split(/\r?\n/u).find(Boolean);
  if (!gitExecutable) {
    throw new Error("Git for Windows is required to run the CNB scan fixtures.");
  }
  const candidate = path.join(path.dirname(path.dirname(gitExecutable)), "bin", "bash.exe");
  if (!existsSync(candidate)) {
    throw new Error(`Git Bash was not found at ${candidate}.`);
  }
  return candidate;
}

const bashExecutable = resolveBashExecutable();

function shellPath(value) {
  const normalized = value.replaceAll("\\", "/");
  if (process.platform !== "win32") {
    return normalized;
  }
  return normalized.replace(/^([A-Za-z]):/, (_, drive) => `/${drive.toLowerCase()}`);
}

function writeDigestEvidence(evidenceRoot) {
  mkdirSync(evidenceRoot, { recursive: true });
  for (const image of ["backend", "web", "admin"]) {
    writeFileSync(path.join(evidenceRoot, `${image}-digest.txt`), `${digest}\n`, "utf8");
  }
}

function runScan(evidenceRoot, blockAdmin) {
  const environment = [
    `PATH="${shellPath(mockBin)}:$PATH"`,
    `EVIDENCE_ROOT="${shellPath(evidenceRoot)}"`,
    "TCR_REGISTRY=ccr.ccs.tencentyun.com",
    "TCR_NAMESPACE=pinjie-fullstack-base",
    "TCR_PUBLISH_USERNAME=test-user",
    "TCR_PUBLISH_PASSWORD=test-password",
    `MOCK_ADMIN_BLOCK=${blockAdmin ? "1" : "0"}`,
  ].join(" ");
  return spawnSync(bashExecutable, ["-lc", `${environment} sh "${shellPath(scanScript)}"`], {
    encoding: "utf8",
  });
}

function requireCondition(condition, message, result) {
  if (condition) {
    return;
  }
  const detail = result
    ? `\nerror:\n${result.error ?? "none"}\nstdout:\n${result.stdout ?? ""}\nstderr:\n${result.stderr ?? ""}`
    : "";
  throw new Error(`${message}${detail}`);
}

try {
  mkdirSync(mockBin, { recursive: true });
  const mockTrivy = path.join(mockBin, "trivy");
  writeFileSync(
    mockTrivy,
    `#!/bin/sh
set -eu
format=""
output=""
image_ref=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --format)
      shift
      format="$1"
      ;;
    --output)
      shift
      output="$1"
      ;;
    *)
      image_ref="$1"
      ;;
  esac
  shift
done
mkdir -p "$(dirname "$output")"
case "$format" in
  json)
    printf '{"Results":[]}\n' > "$output"
    ;;
  table)
    if [ "\${MOCK_ADMIN_BLOCK:-0}" = "1" ] && echo "$image_ref" | grep -q 'pinjie-fullstack-admin'; then
      printf 'Library  Vulnerability  Severity  Installed  Fixed\\nlibfixture  CVE-2099-0001  HIGH  1.0-r0  1.0-r1\\n' > "$output"
      exit 1
    fi
    printf 'Total: 0 (HIGH: 0, CRITICAL: 0)\\n' > "$output"
    ;;
  cyclonedx)
    printf '{"bomFormat":"CycloneDX"}\n' > "$output"
    ;;
  *)
    printf 'Unexpected format: %s\n' "$format" >&2
    exit 2
    ;;
esac
`,
    "utf8",
  );
  chmodSync(mockTrivy, 0o755);

  const blockedEvidence = path.join(fixtureRoot, "blocked-evidence");
  writeDigestEvidence(blockedEvidence);
  const blockedResult = runScan(blockedEvidence, true);
  requireCondition(blockedResult.status === 1, "Expected Admin vulnerability to block the scan.", blockedResult);
  const summaryPath = path.join(blockedEvidence, "scan-failure-summary.txt");
  requireCondition(existsSync(summaryPath), "Expected a failure summary.", blockedResult);
  const summary = readFileSync(summaryPath, "utf8");
  requireCondition(summary.includes("image=admin"), "Expected the summary to identify Admin.", blockedResult);
  requireCondition(summary.includes("CVE-2099-0001"), "Expected the summary to include the CVE.", blockedResult);
  requireCondition(summary.includes("1.0-r1"), "Expected the summary to include the fixed version.", blockedResult);
  requireCondition(existsSync(path.join(blockedEvidence, "admin-trivy.json")), "Expected raw Admin JSON evidence.", blockedResult);
  requireCondition(!existsSync(path.join(blockedEvidence, "admin-sbom.cdx.json")), "Blocked Admin must not have a success SBOM.", blockedResult);

  const passingEvidence = path.join(fixtureRoot, "passing-evidence");
  writeDigestEvidence(passingEvidence);
  const passingResult = runScan(passingEvidence, false);
  requireCondition(passingResult.status === 0, "Expected all image scans to pass.", passingResult);
  for (const image of ["backend", "web", "admin"]) {
    requireCondition(existsSync(path.join(passingEvidence, `${image}-trivy.json`)), `Expected ${image} JSON evidence.`, passingResult);
    requireCondition(existsSync(path.join(passingEvidence, `${image}-sbom.cdx.json`)), `Expected ${image} SBOM evidence.`, passingResult);
  }
  requireCondition(!existsSync(path.join(passingEvidence, "scan-failure-summary.txt")), "Passing scans must not retain a failure summary.", passingResult);

  console.log("CNB image scan fixtures passed: Admin blocking evidence and three-image success.");
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}
