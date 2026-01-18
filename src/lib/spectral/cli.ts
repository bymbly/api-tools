import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { StdioMode } from "../cli/runtime.js";

const nodeRequire = createRequire(import.meta.url);

export function run(args: string[], stdio: StdioMode): number {
  const spectralBin = nodeRequire.resolve(
    "@stoplight/spectral-cli/dist/index.js",
  );

  const res = spawnSync(process.execPath, [spectralBin, ...args], { stdio });

  if (res.error) throw res.error;
  return res.status ?? 0;
}
