import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { run } from "../../src/lib/redocly/cli.js";
import { lint, Options } from "../../src/lib/redocly/lint.js";
import {
  getSpawnCall,
  mockDirent,
  okSpawnResult,
  withDefaults,
} from "../helper.js";

vi.mock("node:child_process");

const createRun = withDefaults<Options>("openapi/openapi.yaml", {
  format: "codeframe",
});

describe("Redocly Lint Functions", () => {
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

    it("should pass format option to redocly", () => {
      const run = createRun({ options: { format: "json" } });

      lint(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--format");
      expect(call.args).toContain("json");
    });

    it("should use CLI-provided config when specified", () => {
      const run = createRun({ options: { config: "custom/redocly.yaml" } });

      lint(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--config");
      expect(call.args).toContain("custom/redocly.yaml");
    });

    it("should not pass config when local config exists", () => {
      vi.spyOn(fs, "readdirSync").mockReturnValue([mockDirent("redocly.yaml")]);

      const run = createRun();

      lint(run);

      const call = getSpawnCall("inherit");
      expect(call.args).not.toContain("--config");
    });

    it("should use bundled config when no local config", () => {
      const run = createRun();

      lint(run);

      const call = getSpawnCall("inherit");
      const configIndex = call.args.indexOf("--config");
      expect(call.args[configIndex + 1]).toContain("defaults/redocly.yaml");
    });

    it("should block --generate-ignore-file with bundled config", () => {
      const run = createRun({
        passthrough: ["--generate-ignore-file"],
      });

      expect(lint(run)).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Cannot use --generate-ignore-file"),
      );
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
        expect.stringContaining("Redocly lint"),
      );
    });

    it("should forward passthrough args to redocly", () => {
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
