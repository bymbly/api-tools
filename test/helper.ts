import { spawnSync } from "node:child_process";
import { expect, vi } from "vitest";

type Stdio = "inherit" | "ignore";

export interface SpawnCall {
  command: string;
  args: string[];
  opts: { stdio: Stdio; env?: NodeJS.ProcessEnv };
}

export function getSpawnCall(expectedStdio: Stdio = "inherit"): SpawnCall {
  const mocked = vi.mocked(spawnSync);
  expect(mocked).toHaveBeenCalledTimes(1);

  const [command, args, opts] = mocked.mock.calls[0] as [
    SpawnCall["command"],
    SpawnCall["args"],
    SpawnCall["opts"],
  ];

  expect(command).toBe(process.execPath);
  expect(opts).toMatchObject({ stdio: expectedStdio });

  return { command, args, opts };
}
