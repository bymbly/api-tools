import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildDocs, Options } from "../../src/lib/redocly/build-docs.js";
import { run } from "../../src/lib/redocly/cli.js";
import {
  getSpawnCall,
  mockDirent,
  okSpawnResult,
  withDefaults,
} from "../helper.js";

vi.mock("node:child_process");

const createRun = withDefaults<string, Options>("openapi/openapi.yaml", {
  output: "dist/docs/openapi.html",
});

describe("Redocly Build-Docs Functions", () => {
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
        ["build-docs", "spec.yaml", "--output", "docs.html"],
        "inherit",
      );

      expect(exitCode).toBe(0);
      const call = getSpawnCall("inherit");
      expect(call.args).toEqual(
        expect.arrayContaining([
          "build-docs",
          "spec.yaml",
          "--output",
          "docs.html",
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

      const exitCode = run(["build-docs", "bad.yaml"], "inherit");
      expect(exitCode).toBe(2);
    });
  });

  describe("buildDocs", () => {
    it("should use provided input", () => {
      const run = createRun();

      expect(buildDocs(run)).toBe(0);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("openapi/openapi.yaml");
    });

    it("should use custom input when provided", () => {
      const run = createRun({ input: "custom/spec.yaml" });

      buildDocs(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("custom/spec.yaml");
    });

    it("should use default output path", () => {
      const run = createRun();

      buildDocs(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--output");
      expect(call.args).toContain("dist/docs/openapi.html");
    });

    it("should use custom output when provided", () => {
      const run = createRun({ options: { output: "custom/docs.html" } });

      buildDocs(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--output");
      expect(call.args).toContain("custom/docs.html");
    });

    it("should use CLI-provided config when specified", () => {
      const run = createRun({ options: { config: "custom/redocly.yaml" } });

      buildDocs(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--config");
      expect(call.args).toContain("custom/redocly.yaml");
    });

    it("should not pass config when local config exists", () => {
      vi.spyOn(fs, "readdirSync").mockReturnValue([mockDirent("redocly.yaml")]);

      const run = createRun();

      buildDocs(run);

      const call = getSpawnCall("inherit");
      expect(call.args).not.toContain("--config");
    });

    it("should use bundled config when no local config", () => {
      const run = createRun();

      buildDocs(run);

      const call = getSpawnCall("inherit");
      const configIndex = call.args.indexOf("--config");
      expect(call.args[configIndex + 1]).toContain("defaults/redocly.yaml");
    });

    it("should use ignore stdio when globals.silent is true", () => {
      const run = createRun({ globals: { quiet: false, silent: true } });

      buildDocs(run);
      getSpawnCall("ignore");
    });

    it("should suppress wrapper logging when quiet", () => {
      const logSpy = vi.spyOn(console, "log");

      const run = createRun({ globals: { quiet: true, silent: false } });

      buildDocs(run);

      expect(logSpy).not.toHaveBeenCalled();
    });

    it("should show wrapper logging when not quiet", () => {
      const logSpy = vi.spyOn(console, "log");

      const run = createRun({ globals: { quiet: false, silent: false } });

      buildDocs(run);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("Redocly build-docs"),
      );
    });

    it("should forward passthrough args to redocly", () => {
      const run = createRun({
        passthrough: ["--title", "Custom API Docs"],
      });

      buildDocs(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--title");
      expect(call.args).toContain("Custom API Docs");
    });

    it("should return non-zero exit code on build failure", () => {
      vi.mocked(spawnSync).mockReturnValue({
        ...okSpawnResult(),
        status: 1,
      });

      const run = createRun();

      expect(buildDocs(run)).toBe(1);
    });

    it("should throw when spawnSync errors", () => {
      vi.mocked(spawnSync).mockReturnValue({
        ...okSpawnResult(),
        error: new Error("spawn failed"),
      });

      const run = createRun();

      expect(() => buildDocs(run)).toThrow("spawn failed");
    });
  });
});
