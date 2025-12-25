import { execSync } from "child_process";
import { expect, vi } from "vitest";

export function getExecCommand(): string {
  expect(execSync).toHaveBeenCalledTimes(1);
  const [command, opts] = vi.mocked(execSync).mock.calls[0];
  expect(opts).toEqual({ stdio: "inherit" });
  return command as string;
}
