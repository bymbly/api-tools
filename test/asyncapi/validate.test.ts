import { spawnSync } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { run } from "../../src/lib/asyncapi/cli.js";
import { Options, validate } from "../../src/lib/asyncapi/validate.js";
import { getSpawnCall, okSpawnResult, withDefaults } from "../helper.js";

vi.mock("node:child_process");

const createRun = withDefaults<string, Options>("asyncapi/asyncapi.yaml", {
  format: "stylish",
  failSeverity: "warn",
});

describe("AsyncAPI Validate Functions", () => {
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
        ["validate", "spec.yaml", "--diagnostics-format", "json"],
        "inherit",
      );

      expect(exitCode).toBe(0);
      const call = getSpawnCall("inherit");
      expect(call.args).toEqual(
        expect.arrayContaining([
          "validate",
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

      const exitCode = run(["validate", "bad.yaml"], "inherit");
      expect(exitCode).toBe(2);
    });
  });

  describe("validate", () => {
    it("should use provided input", () => {
      const run = createRun();

      expect(validate(run)).toBe(0);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("asyncapi/asyncapi.yaml");
    });

    it("should use custom input when provided", () => {
      const run = createRun({ input: "custom/spec.yaml" });

      validate(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("custom/spec.yaml");
    });

    it("should pass format option to asyncapi", () => {
      const run = createRun({ options: { format: "json" } });

      validate(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--diagnostics-format");
      expect(call.args).toContain("json");
    });

    it("should pass output option when specified", () => {
      const run = createRun({ options: { output: "results.json" } });

      validate(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--save-output");
      expect(call.args).toContain("results.json");
    });

    it("should not pass output option when not specified", () => {
      const run = createRun();

      validate(run);

      const call = getSpawnCall("inherit");
      expect(call.args).not.toContain("--save-output");
    });

    it("should pass fail-severity option", () => {
      const run = createRun({ options: { failSeverity: "error" } });

      validate(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--fail-severity");
      expect(call.args).toContain("error");
    });

    it("should use default fail-severity when not specified", () => {
      const run = createRun();

      validate(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--fail-severity");
      expect(call.args).toContain("warn");
    });

    it("should use ignore stdio when globals.silent is true", () => {
      const run = createRun({ globals: { quiet: false, silent: true } });

      validate(run);
      getSpawnCall("ignore");
    });

    it("should suppress wrapper logging when quiet", () => {
      const logSpy = vi.spyOn(console, "log");

      const run = createRun({ globals: { quiet: true, silent: false } });

      validate(run);

      expect(logSpy).not.toHaveBeenCalled();
    });

    it("should show wrapper logging when not quiet", () => {
      const logSpy = vi.spyOn(console, "log");

      const run = createRun({ globals: { quiet: false, silent: false } });

      validate(run);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("AsyncAPI validate"),
      );
    });

    it("should forward passthrough args to asyncapi", () => {
      const run = createRun({
        passthrough: ["--log-diagnostics"],
      });

      validate(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--log-diagnostics");
    });

    it("should return non-zero exit code on validation failure", () => {
      vi.mocked(spawnSync).mockReturnValue({
        ...okSpawnResult(),
        status: 1,
      });

      const run = createRun();

      expect(validate(run)).toBe(1);
    });

    it("should throw when spawnSync errors", () => {
      vi.mocked(spawnSync).mockReturnValue({
        ...okSpawnResult(),
        error: new Error("spawn failed"),
      });

      const run = createRun();

      expect(() => validate(run)).toThrow("spawn failed");
    });
  });
});
