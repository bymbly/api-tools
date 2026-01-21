import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { run } from "../../src/lib/redocly/cli.js";
import {
  generateArazzo,
  Options,
} from "../../src/lib/redocly/generate-arazzo.js";
import { getSpawnCall, okSpawnResult, withDefaults } from "../helper.js";

vi.mock("node:child_process");

const createRun = withDefaults<Options>("openapi/openapi.yaml", {
  output: "arazzo/auto-generated.arazzo.yaml",
});

describe("Redocly Generate-Arazzo Functions", () => {
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
    it("should pass args directly to redocly", () => {
      const exitCode = run(
        [
          "generate-arazzo",
          "spec.yaml",
          "--output-file",
          "workflows.arazzo.yaml",
        ],
        "inherit",
      );

      expect(exitCode).toBe(0);
      const call = getSpawnCall("inherit");
      expect(call.args).toEqual(
        expect.arrayContaining([
          "generate-arazzo",
          "spec.yaml",
          "--output-file",
          "workflows.arazzo.yaml",
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

      const exitCode = run(["generate-arazzo", "bad.yaml"], "inherit");
      expect(exitCode).toBe(2);
    });
  });

  describe("generateArazzo", () => {
    it("should use provided input", () => {
      const run = createRun();

      expect(generateArazzo(run)).toBe(0);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("openapi/openapi.yaml");
    });

    it("should use custom input when provided", () => {
      const run = createRun({ input: "custom/spec.yaml" });

      generateArazzo(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("custom/spec.yaml");
    });

    it("should use default output path", () => {
      const run = createRun();

      generateArazzo(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--output-file");
      expect(call.args).toContain("arazzo/auto-generated.arazzo.yaml");
    });

    it("should use custom output when provided", () => {
      const run = createRun({
        options: { output: "custom/workflows.arazzo.yaml" },
      });

      generateArazzo(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--output-file");
      expect(call.args).toContain("custom/workflows.arazzo.yaml");
    });

    it("should use ignore stdio when globals.silent is true", () => {
      const run = createRun({ globals: { quiet: false, silent: true } });

      generateArazzo(run);
      getSpawnCall("ignore");
    });

    it("should suppress wrapper logging when quiet", () => {
      const logSpy = vi.spyOn(console, "log");

      const run = createRun({ globals: { quiet: true, silent: false } });

      generateArazzo(run);

      expect(logSpy).not.toHaveBeenCalled();
    });

    it("should show wrapper logging when not quiet", () => {
      const logSpy = vi.spyOn(console, "log");

      const run = createRun({ globals: { quiet: false, silent: false } });

      generateArazzo(run);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("Redocly generate-arazzo"),
      );
    });

    it("should forward passthrough args to redocly", () => {
      const run = createRun({
        passthrough: ["--some-future-option"],
      });

      generateArazzo(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--some-future-option");
    });

    it("should return non-zero exit code on generation failure", () => {
      vi.mocked(spawnSync).mockReturnValue({
        ...okSpawnResult(),
        status: 1,
      });

      const run = createRun();

      expect(generateArazzo(run)).toBe(1);
    });

    it("should throw when spawnSync errors", () => {
      vi.mocked(spawnSync).mockReturnValue({
        ...okSpawnResult(),
        error: new Error("spawn failed"),
      });

      const run = createRun();

      expect(() => generateArazzo(run)).toThrow("spawn failed");
    });
  });
});
