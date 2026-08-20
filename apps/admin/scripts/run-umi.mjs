import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const maxCLI = resolve(appRoot, "node_modules", "@umijs", "max", "bin", "max.js");
const child = spawn(process.execPath, [maxCLI, "dev", ...process.argv.slice(2)], {
  cwd: appRoot,
  env: { ...process.env, PORT: process.env.PORT ?? "3001" },
  shell: false,
  stdio: "inherit",
  windowsHide: true,
});

child.once("error", (error) => {
  process.stderr.write(`${error}\n`);
  process.exitCode = 1;
});
child.once("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
