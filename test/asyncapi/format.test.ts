import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { run } from "../../src/lib/asyncapi/cli.js";
import { format, Options } from "../../src/lib/asyncapi/format.js";
import { getSpawnCall, okSpawnResult, withDefaults } from "../helper.js";

vi.mock("node:child_process");

const createRun = withDefaults<string, Options>("asyncapi/asyncapi.yaml", {
  output: "dist/format/asyncapi.json",
});

describe("AsyncAPI Format Functions", () => {
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
        ["format", "spec.yaml", "--output", "formatted.json"],
        "inherit",
      );

      expect(exitCode).toBe(0);
      const call = getSpawnCall("inherit");
      expect(call.args).toEqual(
        expect.arrayContaining([
          "format",
          "spec.yaml",
          "--output",
          "formatted.json",
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

      const exitCode = run(["format", "bad.yaml"], "inherit");
      expect(exitCode).toBe(2);
    });
  });

  describe("format", () => {
    it("should use provided input", () => {
      const run = createRun();

      expect(format(run)).toBe(0);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("asyncapi/asyncapi.yaml");
    });

    it("should use custom input when provided", () => {
      const run = createRun({ input: "custom/spec.yaml" });

      format(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("custom/spec.yaml");
    });

    it("should use default output path", () => {
      const run = createRun();

      format(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--output");
      expect(call.args).toContain("dist/format/asyncapi.json");
    });

    it("should use custom output when provided", () => {
      const run = createRun({ options: { output: "custom/formatted.yaml" } });

      format(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--output");
      expect(call.args).toContain("custom/formatted.yaml");
    });

    it("should override output extension with ext option", () => {
      const run = createRun({ options: { ext: "yaml" } });

      format(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--output");
      expect(call.args).toContain("dist/format/asyncapi.yaml");
    });

    it("should override custom output extension with ext option", () => {
      const run = createRun({
        options: { output: "custom/file.json", ext: "yml" },
      });

      format(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--output");
      expect(call.args).toContain("custom/file.yml");
    });

    it("should pass format flag to asyncapi cli when ext is provided", () => {
      const run = createRun({ options: { ext: "yaml" } });

      format(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--format");
      expect(call.args).toContain("yaml");
    });

    it("should not pass format flag when ext is not provided", () => {
      const run = createRun();

      format(run);

      const call = getSpawnCall("inherit");
      expect(call.args).not.toContain("--format");
    });

    it("should not pass ext option to asyncapi cli", () => {
      const run = createRun({ options: { ext: "json" } });

      format(run);

      const call = getSpawnCall("inherit");
      expect(call.args).not.toContain("--ext");
    });

    it("should use ignore stdio when globals.silent is true", () => {
      const run = createRun({ globals: { quiet: false, silent: true } });

      format(run);
      getSpawnCall("ignore");
    });

    it("should suppress wrapper logging when quiet", () => {
      const logSpy = vi.spyOn(console, "log");

      const run = createRun({ globals: { quiet: true, silent: false } });

      format(run);

      expect(logSpy).not.toHaveBeenCalled();
    });

    it("should show wrapper logging when not quiet", () => {
      const logSpy = vi.spyOn(console, "log");

      const run = createRun({ globals: { quiet: false, silent: false } });

      format(run);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("AsyncAPI format"),
      );
    });

    it("should forward passthrough args to asyncapi", () => {
      const run = createRun({
        passthrough: ["--some-flag"],
      });

      format(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--some-flag");
    });

    it("should return non-zero exit code on format failure", () => {
      vi.mocked(spawnSync).mockReturnValue({
        ...okSpawnResult(),
        status: 1,
      });

      const run = createRun();

      expect(format(run)).toBe(1);
    });

    it("should throw when spawnSync errors", () => {
      vi.mocked(spawnSync).mockReturnValue({
        ...okSpawnResult(),
        error: new Error("spawn failed"),
      });

      const run = createRun();

      expect(() => format(run)).toThrow("spawn failed");
    });
  });
});
