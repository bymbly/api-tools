import { exec, ExecException, spawnSync } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { expect, vi } from "vitest";
import { ExecuteParams } from "../src/lib/cli/helpers.js";

const execAsync = promisify(exec);
const binPath = path.join(process.cwd(), "dist/bin/api-tools.js");

type Stdio = "inherit" | "ignore";

export interface SpawnCall {
  command: string;
  args: string[];
  opts: { stdio: Stdio; env?: NodeJS.ProcessEnv };
}

export function okSpawnResult() {
  return {
    pid: 123,
    output: [],
    stdout: Buffer.from(""),
    stderr: Buffer.from(""),
    status: 0,
    signal: null,
    error: undefined,
  };
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

export async function runCli(args: string[]): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  try {
    const { stdout, stderr } = await execAsync(
      `node ${binPath} ${args.join(" ")}`,
    );
    return { stdout, stderr, exitCode: 0 };
  } catch (error) {
    if (isExecException(error)) {
      return {
        stdout: error.stdout ?? "",
        stderr: error.stderr ?? "",
        exitCode: error.code ?? 1,
      };
    }
    throw error;
  }
}

export function isExecException(error: unknown): error is ExecException {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "stdout" in error &&
    "stderr" in error
  );
}

export type Overrides<T> = Omit<
  Partial<ExecuteParams<Partial<T>>>,
  "options"
> & {
  options?: Partial<T>;
};

export function withDefaults<T>(defaultInput: string, defaultOptions: T) {
  return function createRun(overrides: Overrides<T> = {}): ExecuteParams<T> {
    return {
      input: defaultInput,
      globals: { quiet: false, silent: false },
      passthrough: [],
      ...overrides,
      options: {
        ...defaultOptions,
        ...overrides.options,
      } as T,
    };
  };
}
