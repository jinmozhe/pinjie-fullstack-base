import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));
const methods = new Set(["GET", "PUT", "POST", "DELETE", "OPTIONS", "HEAD", "PATCH", "TRACE"]);
const fields = [
  "id", "plan", "owner", "approvedOn", "expiresOn", "reason", "migration",
  "rollout", "rollback", "cleanup", "method", "path", "message",
];
const dayMs = 86_400_000;
const maxWindowDays = 30;

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function exactKeys(value, expected, label) {
  requireCondition(value !== null && typeof value === "object" && !Array.isArray(value), `${label}: expected an object.`);
  requireCondition(
    Object.keys(value).length === expected.length && expected.every((key) => Object.hasOwn(value, key)),
    `${label}: expected exactly these fields: ${expected.join(", ")}.`,
  );
}

function dateValue(value, label) {
  requireCondition(/^\d{4}-\d{2}-\d{2}$/u.test(value), `${label}: expected YYYY-MM-DD.`);
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  requireCondition(
    Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value,
    `${label}: invalid calendar date.`,
  );
  return timestamp;
}

function readText(filename) {
  const text = readFileSync(filename, "utf8");
  requireCondition(!text.startsWith("\uFEFF") && !text.includes("\uFFFD"), `${filename}: expected UTF-8 without BOM.`);
  return text;
}

// Metadata never enters the native ignore file: oasdiff v1.28.0 does not skip comments.
export function validateOpenApiExceptions(root = repositoryRoot, now = new Date()) {
  const resolvedRoot = realpathSync(root);
  const manifest = JSON.parse(readText(path.join(resolvedRoot, ".oasdiff-exceptions.json")));
  exactKeys(manifest, ["schemaVersion", "exceptions"], "manifest");
  requireCondition(manifest.schemaVersion === 1, "manifest: unsupported schemaVersion.");
  requireCondition(Array.isArray(manifest.exceptions), "manifest: exceptions must be an array.");
  const today = dateValue(now.toISOString().slice(0, 10), "UTC today");
  const ids = new Set();
  const rules = new Set();
  const lines = [];

  for (const entry of manifest.exceptions) {
    exactKeys(entry, fields, "exception");
    for (const field of fields) {
      const value = entry[field];
      requireCondition(
        typeof value === "string" && value.length > 0 && value.length <= 4096 &&
          value === value.trim() && !/[\u0000-\u001f\u007f\u2028\u2029]/u.test(value),
        `${entry.id}: ${field} must be a non-empty, trimmed single line (at most 4096 characters).`,
      );
    }
    requireCondition(/^[a-z][a-z0-9-]{2,79}$/u.test(entry.id), `${entry.id}: invalid exception id.`);
    requireCondition(!ids.has(entry.id), `${entry.id}: duplicate exception id.`);
    ids.add(entry.id);
    requireCondition(/^@[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/iu.test(entry.owner), `${entry.id}: owner must be a GitHub user handle.`);

    const approvedOn = dateValue(entry.approvedOn, `${entry.id} approvedOn`);
    const expiresOn = dateValue(entry.expiresOn, `${entry.id} expiresOn`);
    requireCondition(approvedOn <= today, `${entry.id}: approval date is in the future.`);
    requireCondition(expiresOn > today, `${entry.id}: exception has expired (UTC, expiry date is exclusive).`);
    requireCondition(
      expiresOn > approvedOn && expiresOn - approvedOn <= maxWindowDays * dayMs,
      `${entry.id}: exception window must be between 1 and ${maxWindowDays} days.`,
    );

    requireCondition(
      /^plans\/\d{4}-\d{2}-\d{2}_[^/\\]+计划\.md$/u.test(entry.plan) && !entry.plan.includes(".."),
      `${entry.id}: plan must name a repository implementation plan.`,
    );
    const planPath = realpathSync(path.join(resolvedRoot, entry.plan));
    const planRelative = path.relative(resolvedRoot, planPath);
    requireCondition(
      !path.isAbsolute(planRelative) && !planRelative.startsWith(`..${path.sep}`) && planRelative !== "..",
      `${entry.id}: plan resolves outside the repository.`,
    );
    const plan = readText(planPath);
    const marker = `<!-- oasdiff-exception: ${entry.id} -->`;
    requireCondition(
      plan.split(/\r?\n/u).filter((line) => line === marker).length === 1,
      `${entry.id}: plan must contain exactly one standalone ${marker} marker next to its approval and migration evidence.`,
    );
    const index = readText(path.join(resolvedRoot, "plans/INDEX.md"));
    const reference = `| \`${entry.plan}\` |`;
    requireCondition(
      index.split(/\r?\n/u).filter((line) => line.startsWith(reference)).length === 1,
      `${entry.id}: plan must be registered exactly once in plans/INDEX.md.`,
    );

    requireCondition(methods.has(entry.method), `${entry.id}: method must be an uppercase OpenAPI HTTP method.`);
    requireCondition(
      entry.path.startsWith("/") && !/[\s*?#[\]\\^|]/u.test(entry.path),
      `${entry.id}: path must be one literal OpenAPI path, without wildcards or query strings.`,
    );
    requireCondition(
      !/\b(?:GET|PUT|POST|DELETE|OPTIONS|HEAD|PATCH|TRACE)\s+\//iu.test(entry.message),
      `${entry.id}: message must contain one complete diagnostic, without another method/path.`,
    );
    const line = `${entry.method} ${entry.path} ${entry.message}`;
    // Guard the upstream scanner limit and reject duplicate case-insensitive native rules.
    requireCondition(Buffer.byteLength(line, "utf8") < 60_000, `${entry.id}: native ignore line is too long.`);
    requireCondition(!rules.has(line.toLowerCase()), `${entry.id}: duplicate native ignore rule.`);
    rules.add(line.toLowerCase());
    lines.push(line);
  }

  return { count: lines.length, content: `${lines.join("\n")}\n` };
}

export function run(argv) {
  requireCondition(
    argv.length === 0 || (argv.length === 2 && argv[0] === "--output" && argv[1].length > 0),
    "Usage: node scripts/ci/check-openapi-exceptions.mjs [--output <new temporary file>]",
  );
  const result = validateOpenApiExceptions();
  if (argv.length) {
    // Never overwrite a user file or reuse a previous run's generated allowlist.
    writeFileSync(argv[1], result.content, { encoding: "utf8", flag: "wx" });
  }
  console.log(`OpenAPI exceptions passed: ${result.count} active exception(s); UTC window <= ${maxWindowDays} days.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    run(process.argv.slice(2));
  } catch (error) {
    console.error(`OpenAPI exceptions failed: ${error.message}`);
    process.exitCode = 1;
  }
}
