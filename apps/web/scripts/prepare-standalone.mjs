import { cpSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

const appRoot = resolve(import.meta.dirname, "..");
const candidates = [
  resolve(appRoot, ".next", "standalone", "apps", "web", "server.js"),
  resolve(appRoot, ".next", "standalone", "server.js"),
];
const serverEntry = candidates.find(existsSync);

if (!serverEntry) {
  throw new Error("Standalone server not found after the Next.js build.");
}

const runtimeRoot = dirname(serverEntry);
const staticSource = resolve(appRoot, ".next", "static");
const publicSource = resolve(appRoot, "public");

cpSync(staticSource, resolve(runtimeRoot, ".next", "static"), { recursive: true });
if (existsSync(publicSource)) {
  cpSync(publicSource, resolve(runtimeRoot, "public"), { recursive: true });
}
