import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { validateOpenApiExceptions } from "./check-openapi-exceptions.mjs";

const argv = process.argv.slice(2);
assert.ok(argv.length === 0 || (argv.length === 2 && argv[0] === "--oasdiff"), "Usage: test-openapi-exceptions.mjs [--oasdiff <v1.28.0 executable>]");
const root = mkdtempSync(path.join(os.tmpdir(), "pinjie-openapi-exceptions-"));
const now = new Date("2026-09-11T23:59:59.000Z");
const planName = "2026-09-11_契约迁移计划.md";
const planPath = path.join(root, "plans", planName);
const marker = "<!-- oasdiff-exception: nullable-category -->";
const entry = {
  id: "nullable-category",
  plan: `plans/${planName}`,
  owner: "@contract-owner",
  approvedOn: "2026-09-11",
  expiresOn: "2026-09-25",
  reason: "受控契约变更夹具，不代表母版业务例外。",
  migration: "关联计划记录消费者适配及验证证据。",
  rollout: "先上线能接受空值的消费者，再上线服务端。",
  rollback: "停止产生空值后按计划回滚。",
  cleanup: "基线包含变更后立即清理登记，保留计划。",
  method: "GET",
  path: "/items",
  message: "response property `category` list-of-types was widened by adding types `null` to media type `application/json` of response `200`",
};
let cases = 0;

function manifest(exceptions = [entry]) {
  writeFileSync(path.join(root, ".oasdiff-exceptions.json"), `${JSON.stringify({ schemaVersion: 1, exceptions })}\n`);
}

function rejected(change, pattern) {
  const candidate = structuredClone(entry);
  change(candidate);
  manifest([candidate]);
  assert.throws(() => validateOpenApiExceptions(root, now), pattern);
  cases++;
}

function verifyNative(executable) {
  const version = spawnSync(executable, ["--version"], { encoding: "utf8", cwd: root });
  assert.equal(version.status, 0, version.error?.message ?? version.stderr);
  assert.match(version.stdout, /\boasdiff version 1\.28\.0\s*$/u);
  const response = {
    description: "OK",
    content: { "application/json": { schema: {
      type: "object", required: ["category", "label"],
      properties: { category: { type: "string" }, label: { type: "string" } },
    } } },
  };
  const operation = { responses: { "200": response, "201": response } };
  const base = {
    openapi: "3.1.0", info: { title: "Contract gate fixture", version: "1.0.0" },
    paths: {
      "/items": { get: operation, post: operation },
      "/items/details": { get: operation },
      "/items-extra": { get: operation },
    },
  };
  // Round-trip to remove shared object identity, matching independent OpenAPI schema locations.
  const copy = (value) => JSON.parse(JSON.stringify(value));
  function nullable(spec, route = "/items", method = "get", field = "category", status = "200") {
    spec.paths[route][method].responses[status].content["application/json"].schema.properties[field] = {
      anyOf: [{ type: "string" }, { type: "null" }],
    };
  }
  const baseFile = path.join(root, "base.json");
  const revisionFile = path.join(root, "revision.json");
  const ignoreFile = path.join(root, "native-ignore.txt");
  let nativeCases = 0;
  function diff(original, revision, expectedStatus, useIgnore = false) {
    writeFileSync(baseFile, JSON.stringify(original));
    writeFileSync(revisionFile, JSON.stringify(revision));
    const args = ["breaking", baseFile, revisionFile, "--format", "json", "--fail-on", "ERR", "--allow-external-refs=false"];
    if (useIgnore) args.push("--err-ignore", ignoreFile);
    const result = spawnSync(executable, args, { encoding: "utf8", cwd: root });
    assert.equal(result.status, expectedStatus, result.error?.message ?? `${result.stderr}\n${result.stdout}`);
    nativeCases++;
    return JSON.parse(result.stdout);
  }
  diff(base, base, 0);
  const addition = copy(base);
  addition.paths["/items"].get.parameters = [{ name: "search", in: "query", required: false, schema: { type: "string" } }];
  diff(base, addition, 0);
  const revision = copy(base);
  nullable(revision);
  const errors = diff(base, revision, 1);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].id, "response-property-list-of-types-widened");
  assert.equal(errors[0].operation, "GET");
  assert.equal(errors[0].path, "/items");
  assert.match(errors[0].text, /`category`.*`null`.*`200`/u);

  manifest([]);
  writeFileSync(ignoreFile, validateOpenApiExceptions(root, now).content);
  diff(base, revision, 1, true);
  writeFileSync(planPath, `${marker}\n`);
  writeFileSync(path.join(root, "plans/INDEX.md"), `| \`plans/${planName}\` | 实施中 | 不适用 |\n`);
  manifest([{ ...entry, message: errors[0].text }]);
  writeFileSync(ignoreFile, validateOpenApiExceptions(root, now).content);
  assert.deepEqual(diff(base, revision, 0, true), []);

  for (const change of [
    ["/items", "get", "label", "200"],
    ["/items/details", "get", "category", "200"],
    ["/items-extra", "get", "category", "200"],
    ["/items", "post", "category", "200"],
    ["/items", "get", "category", "201"],
  ]) {
    const extra = copy(revision);
    nullable(extra, ...change);
    const remaining = diff(base, extra, 1, true);
    assert.equal(remaining.length, 1, "Only the additional unregistered change must remain.");
    assert.equal(remaining[0].path, change[0]);
    assert.equal(remaining[0].operation, change[1].toUpperCase());
    assert.ok(remaining[0].text.includes(`\`${change[2]}\``));
    assert.ok(remaining[0].text.includes(`\`${change[3]}\``));
  }
  // An incomplete diagnostic must not suppress the actual error.
  manifest([{ ...entry, message: "response property `category` list-of-types was widened" }]);
  writeFileSync(ignoreFile, validateOpenApiExceptions(root, now).content);
  diff(base, revision, 1, true);
  // Removing the registration restores the original gate, independent of the expiry metadata.
  manifest([]);
  writeFileSync(ignoreFile, validateOpenApiExceptions(root, now).content);
  diff(base, revision, 1, true);
  console.log(`Native oasdiff v1.28.0 contract checks passed: ${nativeCases} cases (OpenAPI 3.1 nullability, exact approval, additional field/path/method/status rejection).`);
}

try {
  mkdirSync(path.dirname(planPath));
  writeFileSync(planPath, `# 契约迁移计划\n\n${marker}\n\n批准、迁移、发布、回滚和清理证据夹具。\n`);
  writeFileSync(path.join(root, "plans/INDEX.md"), `| \`plans/${planName}\` | 实施中 | 不适用 |\n`);
  manifest([]);
  assert.deepEqual(validateOpenApiExceptions(root, now), { count: 0, content: "\n" });
  cases++;
  manifest();
  assert.deepEqual(validateOpenApiExceptions(root, now), {
    count: 1, content: `GET /items ${entry.message}\n`,
  });
  cases++;
  assert.throws(() => validateOpenApiExceptions(root, new Date("2026-09-25T00:00:00Z")), /expired/u);
  cases++;

  rejected((x) => { x.approvedOn = "2026-09-12"; }, /future/u);
  rejected((x) => { x.expiresOn = "2026-09-11"; }, /expired/u);
  rejected((x) => { x.expiresOn = "2026-02-30"; }, /invalid calendar date/u);
  rejected((x) => { x.expiresOn = "2026-10-12"; }, /30 days/u);
  rejected((x) => { x.approvedOn = "2026-9-11"; }, /YYYY-MM-DD/u);
  rejected((x) => { x.plan = "../plans/2026-09-11_契约迁移计划.md"; }, /repository implementation plan/u);
  rejected((x) => { x.plan = "plans/2026-09-11_不存在计划.md"; }, /ENOENT/u);
  rejected((x) => { x.owner = "owner"; }, /GitHub user handle/u);
  rejected((x) => { x.method = "get"; }, /uppercase/u);
  rejected((x) => { x.path = "/items/*"; }, /literal OpenAPI path/u);
  rejected((x) => { x.path = "/items?name=x"; }, /literal OpenAPI path/u);
  rejected((x) => { x.message += "\nGET /other removed"; }, /single line/u);
  rejected((x) => { x.message += " GET /other removed"; }, /one complete diagnostic/u);
  rejected((x) => { x.path = "/items\u0000"; }, /single line/u);
  rejected((x) => { x.message = "a".repeat(4097); }, /4096/u);
  rejected((x) => { x.unrecognized = true; }, /exactly these fields/u);
  for (const field of ["reason", "migration", "rollout", "rollback", "cleanup", "owner"]) {
    rejected((x) => { x[field] = ""; }, /non-empty/u);
    rejected((x) => { delete x[field]; }, /exactly these fields/u);
  }

  manifest([entry, entry]);
  assert.throws(() => validateOpenApiExceptions(root, now), /duplicate exception id/u);
  cases++;
  const duplicate = { ...entry, id: "duplicate-category", path: "/ITEMS" };
  writeFileSync(planPath, `${marker}\n<!-- oasdiff-exception: duplicate-category -->\n`);
  manifest([entry, duplicate]);
  assert.throws(() => validateOpenApiExceptions(root, now), /duplicate native ignore rule/u);
  cases++;
  manifest();
  writeFileSync(planPath, "# missing approval marker\n");
  assert.throws(() => validateOpenApiExceptions(root, now), /exactly one standalone/u);
  cases++;
  writeFileSync(planPath, `${marker}\n${marker}\n`);
  assert.throws(() => validateOpenApiExceptions(root, now), /exactly one standalone/u);
  cases++;
  writeFileSync(planPath, `${marker}\n`);
  writeFileSync(path.join(root, "plans/INDEX.md"), "# missing registration\n");
  assert.throws(() => validateOpenApiExceptions(root, now), /registered exactly once/u);
  cases++;
  for (const raw of ["{", '{"schemaVersion":2,"exceptions":[]}', '{"schemaVersion":1,"exceptions":null}', '\uFEFF{"schemaVersion":1,"exceptions":[]}']) {
    writeFileSync(path.join(root, ".oasdiff-exceptions.json"), raw);
    assert.throws(() => validateOpenApiExceptions(root, now));
    cases++;
  }

  const script = fileURLToPath(new URL("./check-openapi-exceptions.mjs", import.meta.url));
  const outputPath = path.join(root, "generated.txt");
  writeFileSync(outputPath, "existing user file\n");
  const result = spawnSync(process.execPath, [script, "--output", outputPath], { encoding: "utf8" });
  assert.notEqual(result.status, 0, "Generator must refuse to overwrite existing files.");
  assert.match(result.stderr, /EEXIST/u);
  assert.equal(readFileSync(outputPath, "utf8"), "existing user file\n");
  cases++;

  // Protect the actual workflow wiring; these tests never run application tests or workflows.
  const workflow = YAML.parse(readFileSync(new URL("../../.github/workflows/ci-backend.yml", import.meta.url), "utf8"));
  const job = workflow.jobs["breaking-contract"];
  assert.equal(job.if, "github.event_name == 'pull_request'");
  const steps = job.steps;
  const generateIndex = steps.findIndex((step) => step.run?.includes("check-openapi-exceptions.mjs --output temp/oasdiff-ignore.txt"));
  const compareIndex = steps.findIndex((step) => step.uses?.startsWith("oasdiff/oasdiff-action/breaking@"));
  assert.ok(generateIndex >= 0 && compareIndex > generateIndex, "Exception validation must precede oasdiff.");
  for (const node of [job, steps[generateIndex], steps[compareIndex]]) {
    assert.ok(!node["continue-on-error"], "Contract failures must block CI.");
  }
  assert.equal(steps[generateIndex].if, undefined);
  assert.equal(steps[compareIndex].if, undefined);
  assert.equal(steps[compareIndex].with["fail-on"], "ERR");
  assert.equal(steps[compareIndex].with["err-ignore"], "temp/oasdiff-ignore.txt");
  assert.equal(steps[compareIndex].with.review, false);
  assert.equal(steps[compareIndex].with.base, "origin/${{ github.base_ref }}:openapi.json");
  assert.equal(steps[compareIndex].with.revision, "HEAD:openapi.json");
  assert.ok(!steps[compareIndex].with["exclude-elements"] && !steps[compareIndex].with["warn-ignore"]);
  const governance = YAML.parse(readFileSync(new URL("../../.github/workflows/ci-governance.yml", import.meta.url), "utf8"));
  for (const command of ["pnpm check:openapi-exceptions", "pnpm check:openapi-exceptions:guards"]) {
    const step = governance.jobs.governance.steps.find((item) => item.run === command);
    assert.ok(step && !step.if && !step["continue-on-error"], `${command} must run on every governance check.`);
  }
  cases++;
  console.log(`OpenAPI exception guard fixtures passed: ${cases} cases (metadata, generation safety and CI wiring).`);
  if (argv.length) verifyNative(path.resolve(argv[1]));
} finally {
  // mkdtempSync above is the sole source of this task-owned fixture path.
  assert.equal(path.dirname(root), os.tmpdir());
  assert.ok(path.basename(root).startsWith("pinjie-openapi-exceptions-"));
  rmSync(root, { recursive: true, force: true });
}
