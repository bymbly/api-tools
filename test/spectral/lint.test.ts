import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { run } from "../../src/lib/spectral/cli.js";
import type { Options } from "../../src/lib/spectral/lint.js";
import { lint } from "../../src/lib/spectral/lint.js";
import {
  getSpawnCall,
  mockDirent,
  okSpawnResult,
  withDefaults,
} from "../helper.js";

vi.mock("node:child_process");

const createRun = withDefaults<Options>("openapi/openapi.yaml", {
  format: "stylish",
  failSeverity: "warn",
  displayOnlyFailures: false,
  verbose: false,
});

describe("Spectral Lint Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(vi.fn());
    vi.spyOn(console, "error").mockImplementation(vi.fn());
    vi.spyOn(fs, "readdirSync").mockReturnValue([]);
    vi.mocked(spawnSync).mockReturnValue(okSpawnResult());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("run", () => {
    it("should pass args directly to spectral", () => {
      const exitCode = run(
        ["lint", "spec.yaml", "--format", "json"],
        "inherit",
      );

      expect(exitCode).toBe(0);
      const call = getSpawnCall("inherit");
      expect(call.args).toEqual(
        expect.arrayContaining(["lint", "spec.yaml", "--format", "json"]),
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
      expect(call.args).toContain("openapi/openapi.yaml");
    });

    it("should use custom input when provided", () => {
      const run = createRun({ input: "custom/spec.yaml" });

      lint(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("custom/spec.yaml");
    });

    it("should pass format option to spectral", () => {
      const run = createRun({ options: { format: "json" } });

      lint(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--format");
      expect(call.args).toContain("json");
    });

    it("should pass output option when specified", () => {
      const run = createRun({
        options: { format: "json", output: "results.json" },
      });

      lint(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--output");
      expect(call.args).toContain("results.json");
    });

    it("should use CLI-provided ruleset when specified", () => {
      const run = createRun({ options: { ruleset: "custom/spectral.yaml" } });

      lint(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--ruleset");
      expect(call.args).toContain("custom/spectral.yaml");
    });

    it("should not pass ruleset when local config exists", () => {
      vi.spyOn(fs, "readdirSync").mockReturnValue([
        mockDirent(".spectral.yaml"),
      ]);

      const run = createRun();

      lint(run);

      const call = getSpawnCall("inherit");
      expect(call.args).not.toContain("--ruleset");
    });

    it("should use bundled ruleset when no local config", () => {
      const run = createRun();

      lint(run);

      const call = getSpawnCall("inherit");
      const rulesetIndex = call.args.indexOf("--ruleset");
      expect(call.args[rulesetIndex + 1]).toContain("defaults/spectral.yaml");
    });

    it("should pass fail-severity option", () => {
      const run = createRun({ options: { failSeverity: "error" } });

      lint(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--fail-severity");
      expect(call.args).toContain("error");
    });

    it("should pass display-only-failures flag when true", () => {
      const run = createRun({ options: { displayOnlyFailures: true } });

      lint(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--display-only-failures");
    });

    it("should not pass display-only-failures flag when false", () => {
      const run = createRun({ options: { displayOnlyFailures: false } });

      lint(run);

      const call = getSpawnCall("inherit");
      expect(call.args).not.toContain("--display-only-failures");
    });

    it("should pass verbose flag when true", () => {
      const run = createRun({ options: { verbose: true } });

      lint(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--verbose");
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
        expect.stringContaining("🔍 Spectral lint"),
      );
    });

    it("should forward passthrough args to spectral", () => {
      const run = createRun({
        passthrough: ["--ignore-unknown-format"],
      });

      lint(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--ignore-unknown-format");
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
