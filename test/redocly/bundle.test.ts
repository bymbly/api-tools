import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bundle, Options } from "../../src/lib/redocly/bundle.js";
import { run } from "../../src/lib/redocly/cli.js";
import {
  getSpawnCall,
  mockDirent,
  okSpawnResult,
  withDefaults,
} from "../helper.js";

vi.mock("node:child_process");

const createRun = withDefaults<string, Options>("openapi/openapi.yaml", {
  output: "dist/bundle/openapi.yaml",
  dereferenced: false,
});

describe("Redocly Bundle Functions", () => {
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
      expect(call.args).toContain("openapi/openapi.yaml");
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
      expect(call.args).toContain("dist/bundle/openapi.yaml");
    });

    it("should use custom output when provided", () => {
      const run = createRun({ options: { output: "custom/bundle.yaml" } });

      bundle(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--output");
      expect(call.args).toContain("custom/bundle.yaml");
    });

    it("should pass ext option when provided", () => {
      const run = createRun({ options: { ext: "json" } });

      bundle(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--ext");
      expect(call.args).toContain("json");
    });

    it("should not pass ext option when not provided", () => {
      const run = createRun();

      bundle(run);

      const call = getSpawnCall("inherit");
      expect(call.args).not.toContain("--ext");
    });

    it("should pass dereferenced flag when true", () => {
      const run = createRun({ options: { dereferenced: true } });

      bundle(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--dereferenced");
    });

    it("should not pass dereferenced flag when false", () => {
      const run = createRun({ options: { dereferenced: false } });

      bundle(run);

      const call = getSpawnCall("inherit");
      expect(call.args).not.toContain("--dereferenced");
    });

    it("should use CLI-provided config when specified", () => {
      const run = createRun({ options: { config: "custom/redocly.yaml" } });

      bundle(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--config");
      expect(call.args).toContain("custom/redocly.yaml");
    });

    it("should not pass config when local config exists", () => {
      vi.spyOn(fs, "readdirSync").mockReturnValue([mockDirent("redocly.yaml")]);

      const run = createRun();

      bundle(run);

      const call = getSpawnCall("inherit");
      expect(call.args).not.toContain("--config");
    });

    it("should use bundled config when no local config", () => {
      const run = createRun();

      bundle(run);

      const call = getSpawnCall("inherit");
      const configIndex = call.args.indexOf("--config");
      expect(call.args[configIndex + 1]).toContain("defaults/redocly.yaml");
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
        expect.stringContaining("Redocly bundle"),
      );
    });

    it("should log extension when provided", () => {
      const logSpy = vi.spyOn(console, "log");

      const run = createRun({
        globals: { quiet: false, silent: false },
        options: { ext: "json" },
      });

      bundle(run);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("Extension: json"),
      );
    });

    it("should forward passthrough args to redocly", () => {
      const run = createRun({
        passthrough: ["--remove-unused-components"],
      });

      bundle(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--remove-unused-components");
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
