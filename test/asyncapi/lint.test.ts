import { spawnSync } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { run } from "../../src/lib/asyncapi/cli.js";
import { Options, lint } from "../../src/lib/asyncapi/lint.js";
import { getSpawnCall, okSpawnResult, withDefaults } from "../helper.js";

vi.mock("node:child_process");

const createRun = withDefaults<string, Options>("asyncapi/asyncapi.yaml", {
  format: "stylish",
  failSeverity: "warn",
});

describe("AsyncAPI Lint Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(vi.fn());
    vi.spyOn(console, "error").mockImplementation(vi.fn());
    vi.mocked(spawnSync).mockReturnValue(okSpawnResult());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("run", () => {
    it("should pass args directly to asyncapi cli", () => {
      const exitCode = run(
        ["lint", "spec.yaml", "--diagnostics-format", "json"],
        "inherit",
      );

      expect(exitCode).toBe(0);
      const call = getSpawnCall("inherit");
      expect(call.args).toEqual(
        expect.arrayContaining([
          "lint",
          "spec.yaml",
          "--diagnostics-format",
          "json",
        ]),
      );
    });

    it("should use ignore stdio when specified", () => {
      run(["--version"], "ignore");
      getSpawnCall("ignore");
    });

    it("should return non-zero exit code on failure", () => {
      vi.mocked(spawnSync).mockReturnValue({
        ...okSpawnResult(),
        status: 2,
      });

      const exitCode = run(["lint", "bad.yaml"], "inherit");
      expect(exitCode).toBe(2);
    });
  });

  describe("lint", () => {
    it("should use provided input", () => {
      const run = createRun();

      expect(lint(run)).toBe(0);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("asyncapi/asyncapi.yaml");
    });

    it("should use custom input when provided", () => {
      const run = createRun({ input: "custom/spec.yaml" });

      lint(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("custom/spec.yaml");
    });

    it("should pass format option to asyncapi", () => {
      const run = createRun({ options: { format: "json" } });

      lint(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--diagnostics-format");
      expect(call.args).toContain("json");
    });

    it("should pass output option when specified", () => {
      const run = createRun({ options: { output: "results.json" } });

      lint(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--save-output");
      expect(call.args).toContain("results.json");
    });

    it("should not pass output option when not specified", () => {
      const run = createRun();

      lint(run);

      const call = getSpawnCall("inherit");
      expect(call.args).not.toContain("--save-output");
    });

    it("should pass fail-severity option", () => {
      const run = createRun({ options: { failSeverity: "error" } });

      lint(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--fail-severity");
      expect(call.args).toContain("error");
    });

    it("should use default fail-severity when not specified", () => {
      const run = createRun();

      lint(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--fail-severity");
      expect(call.args).toContain("warn");
    });

    it("should use ignore stdio when globals.silent is true", () => {
      const run = createRun({ globals: { quiet: false, silent: true } });

      lint(run);
      getSpawnCall("ignore");
    });

    it("should suppress wrapper logging when quiet", () => {
      const logSpy = vi.spyOn(console, "log");

      const run = createRun({ globals: { quiet: true, silent: false } });

      lint(run);

      expect(logSpy).not.toHaveBeenCalled();
    });

    it("should show wrapper logging when not quiet", () => {
      const logSpy = vi.spyOn(console, "log");

      const run = createRun({ globals: { quiet: false, silent: false } });

      lint(run);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("AsyncAPI lint"),
      );
    });

    it("should forward passthrough args to asyncapi", () => {
      const run = createRun({
        passthrough: ["--log-diagnostics"],
      });

      lint(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--log-diagnostics");
    });

    it("should return non-zero exit code on lint failure", () => {
      vi.mocked(spawnSync).mockReturnValue({
        ...okSpawnResult(),
        status: 1,
      });

      const run = createRun();

      expect(lint(run)).toBe(1);
    });

    it("should throw when spawnSync errors", () => {
      vi.mocked(spawnSync).mockReturnValue({
        ...okSpawnResult(),
        error: new Error("spawn failed"),
      });

      const run = createRun();

      expect(() => lint(run)).toThrow("spawn failed");
    });
  });
});
