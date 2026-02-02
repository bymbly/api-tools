import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bundle, Options } from "../../src/lib/asyncapi/bundle.js";
import { run } from "../../src/lib/asyncapi/cli.js";
import { getSpawnCall, okSpawnResult, withDefaults } from "../helper.js";

vi.mock("node:child_process");

const createRun = withDefaults<string, Options>("asyncapi/asyncapi.yaml", {
  output: "dist/bundle/asyncapi.yaml",
  xOrigin: false,
});

describe("AsyncAPI Bundle Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(vi.fn());
    vi.spyOn(console, "error").mockImplementation(vi.fn());
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "mkdirSync").mockImplementation(vi.fn());
    vi.mocked(spawnSync).mockReturnValue(okSpawnResult());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("run", () => {
    it("should pass args directly to asyncapi cli", () => {
      const exitCode = run(
        ["bundle", "spec.yaml", "--output", "bundle.yaml"],
        "inherit",
      );

      expect(exitCode).toBe(0);
      const call = getSpawnCall("inherit");
      expect(call.args).toEqual(
        expect.arrayContaining([
          "bundle",
          "spec.yaml",
          "--output",
          "bundle.yaml",
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

      const exitCode = run(["bundle", "bad.yaml"], "inherit");
      expect(exitCode).toBe(2);
    });
  });

  describe("bundle", () => {
    it("should use provided input", () => {
      const run = createRun();

      expect(bundle(run)).toBe(0);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("asyncapi/asyncapi.yaml");
    });

    it("should use custom input when provided", () => {
      const run = createRun({ input: "custom/spec.yaml" });

      bundle(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("custom/spec.yaml");
    });

    it("should use default output path", () => {
      const run = createRun();

      bundle(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--output");
      expect(call.args).toContain("dist/bundle/asyncapi.yaml");
    });

    it("should use custom output when provided", () => {
      const run = createRun({ options: { output: "custom/bundle.yaml" } });

      bundle(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--output");
      expect(call.args).toContain("custom/bundle.yaml");
    });

    it("should override output extension with ext option", () => {
      const run = createRun({ options: { ext: "json" } });

      bundle(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--output");
      expect(call.args).toContain("dist/bundle/asyncapi.json");
    });

    it("should override custom output extension with ext option", () => {
      const run = createRun({
        options: { output: "custom/bundle.yaml", ext: "json" },
      });

      bundle(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--output");
      expect(call.args).toContain("custom/bundle.json");
    });

    it("should handle yml extension", () => {
      const run = createRun({ options: { ext: "yml" } });

      bundle(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("dist/bundle/asyncapi.yml");
    });

    it("should not pass ext option to asyncapi cli", () => {
      const run = createRun({ options: { ext: "json" } });

      bundle(run);

      const call = getSpawnCall("inherit");
      expect(call.args).not.toContain("--ext");
    });

    it("should pass x-origin flag when true", () => {
      const run = createRun({ options: { xOrigin: true } });

      bundle(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--x-origin");
    });

    it("should not pass x-origin flag when false", () => {
      const run = createRun({ options: { xOrigin: false } });

      bundle(run);

      const call = getSpawnCall("inherit");
      expect(call.args).not.toContain("--x-origin");
    });

    it("should use ignore stdio when globals.silent is true", () => {
      const run = createRun({ globals: { quiet: false, silent: true } });

      bundle(run);
      getSpawnCall("ignore");
    });

    it("should suppress wrapper logging when quiet", () => {
      const logSpy = vi.spyOn(console, "log");

      const run = createRun({ globals: { quiet: true, silent: false } });

      bundle(run);

      expect(logSpy).not.toHaveBeenCalled();
    });

    it("should show wrapper logging when not quiet", () => {
      const logSpy = vi.spyOn(console, "log");

      const run = createRun({ globals: { quiet: false, silent: false } });

      bundle(run);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("AsyncAPI bundle"),
      );
    });

    it("should forward passthrough args to asyncapi", () => {
      const run = createRun({
        passthrough: ["--base", "main.yaml"],
      });

      bundle(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--base");
      expect(call.args).toContain("main.yaml");
    });

    it("should return non-zero exit code on bundle failure", () => {
      vi.mocked(spawnSync).mockReturnValue({
        ...okSpawnResult(),
        status: 1,
      });

      const run = createRun();

      expect(bundle(run)).toBe(1);
    });

    it("should throw when spawnSync errors", () => {
      vi.mocked(spawnSync).mockReturnValue({
        ...okSpawnResult(),
        error: new Error("spawn failed"),
      });

      const run = createRun();

      expect(() => bundle(run)).toThrow("spawn failed");
    });
  });
});
