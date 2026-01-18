import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { StdioMode } from "../cli/runtime.js";

const nodeRequire = createRequire(import.meta.url);

export function run(args: string[], stdio: StdioMode): number {
  const redoclyBin = nodeRequire.resolve("@redocly/cli/bin/cli.js");

  const res = spawnSync(process.execPath, [redoclyBin, ...args], { stdio });

  if (res.error) throw res.error;
  return res.status ?? 0;
}
