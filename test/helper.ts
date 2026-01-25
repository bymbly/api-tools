import { spawnSync } from "node:child_process";
import path from "node:path";
import { expect, vi } from "vitest";
import {
  MultiInputExecuteParams,
  SingleInputExecuteParams,
} from "../src/lib/cli/helpers.js";

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

export function runCli(args: string[]): {
  stdout: string;
  stderr: string;
  exitCode: number;
} {
  const res = spawnSync(process.execPath, [binPath, ...args], {
    encoding: "utf-8",
    timeout: 30_000,
  });

  return {
    stdout: res.stdout,
    stderr: res.error ? res.stderr + String(res.error) : res.stderr,
    exitCode: res.status ?? 1,
  };
}

type Override<Params extends { options: unknown }> = Omit<
  Partial<Params>,
  "options"
> & { options?: Partial<Params["options"]> };

type SingleInputOverrides<T> = Override<SingleInputExecuteParams<T>>;
type MultiInputOverrides<T> = Override<MultiInputExecuteParams<T>>;

type Overrides<I, T> = I extends string
  ? (overrides?: SingleInputOverrides<T>) => SingleInputExecuteParams<T>
  : (overrides?: MultiInputOverrides<T>) => MultiInputExecuteParams<T>;

export function withDefaults<I extends string | readonly string[], T>(
  defaultInput: I,
  defaultOptions: T,
): Overrides<I, T> {
  return ((overrides: unknown = {}) => {
    const o = (overrides ?? {}) as {
      options?: Partial<T>;
      input?: string;
      inputs?: readonly string[];
    };

    const options = { ...defaultOptions, ...(o.options ?? {}) };
    const base = {
      globals: { quiet: false, silent: false },
      passthrough: [],
      ...(o as object),
      options,
    };

    if (typeof defaultInput === "string") {
      return { ...base, input: o.input ?? defaultInput };
    }

    return { ...base, inputs: o.inputs ?? defaultInput };
  }) as Overrides<I, T>;
}

export function mockDirent(filename: string) {
  return {
    name: Buffer.from(filename),
    parentPath: "",
    isFile: () => true,
    isDirectory: () => false,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isSymbolicLink: () => false,
    isFIFO: () => false,
    isSocket: () => false,
  };
}
