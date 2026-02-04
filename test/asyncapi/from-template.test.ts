import { spawnSync } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { run } from "../../src/lib/asyncapi/cli.js";
import {
  fromTemplate,
  Options,
} from "../../src/lib/asyncapi/generate/from-template.js";
import { getSpawnCall, okSpawnResult, withDefaults } from "../helper.js";

vi.mock("node:child_process");

const createRun = withDefaults<string, Options>("asyncapi/asyncapi.yaml", {
  template: "@asyncapi/html-template",
  output: "dist/generated/",
  params: [],
  forceWrite: false,
});

describe("AsyncAPI From-Template Functions", () => {
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
        [
          "generate",
          "fromTemplate",
          "spec.yaml",
          "@asyncapi/html-template",
          "--output",
          "dist/",
        ],
        "inherit",
      );

      expect(exitCode).toBe(0);
      const call = getSpawnCall("inherit");
      expect(call.args).toEqual(
        expect.arrayContaining([
          "generate",
          "fromTemplate",
          "spec.yaml",
          "@asyncapi/html-template",
          "--output",
          "dist/",
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

      const exitCode = run(
        ["generate", "fromTemplate", "bad.yaml", "@asyncapi/html-template"],
        "inherit",
      );
      expect(exitCode).toBe(2);
    });
  });

  describe("fromTemplate", () => {
    it("should use provided input", () => {
      const run = createRun();

      expect(fromTemplate(run)).toBe(0);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("asyncapi/asyncapi.yaml");
    });

    it("should use custom input when provided", () => {
      const run = createRun({ input: "custom/spec.yaml" });

      fromTemplate(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("custom/spec.yaml");
    });

    it("should use provided template", () => {
      const run = createRun();

      fromTemplate(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("@asyncapi/html-template");
    });

    it("should use custom template when provided", () => {
      const run = createRun({
        options: { template: "@asyncapi/nodejs-template" },
      });

      fromTemplate(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("@asyncapi/nodejs-template");
    });

    it("should use default output path", () => {
      const run = createRun();

      fromTemplate(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--output");
      expect(call.args).toContain("dist/generated/");
    });

    it("should use custom output when provided", () => {
      const run = createRun({ options: { output: "custom/output/" } });

      fromTemplate(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--output");
      expect(call.args).toContain("custom/output/");
    });

    it("should always pass --install flag", () => {
      const run = createRun();

      fromTemplate(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--install");
    });

    it("should always pass --no-interactive flag", () => {
      const run = createRun();

      fromTemplate(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--no-interactive");
    });

    it("should pass force-write flag when true", () => {
      const run = createRun({ options: { forceWrite: true } });

      fromTemplate(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--force-write");
    });

    it("should not pass force-write flag when false", () => {
      const run = createRun({ options: { forceWrite: false } });

      fromTemplate(run);

      const call = getSpawnCall("inherit");
      expect(call.args).not.toContain("--force-write");
    });

    it("should pass single param to asyncapi cli", () => {
      const run = createRun({ options: { params: ["version=1.0.0"] } });

      fromTemplate(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--param");
      expect(call.args).toContain("version=1.0.0");
    });

    it("should pass multiple params to asyncapi cli", () => {
      const run = createRun({
        options: { params: ["version=1.0.0", "singleFile=true", "title=API"] },
      });

      fromTemplate(run);

      const call = getSpawnCall("inherit");
      const paramIndex = call.args.indexOf("--param");
      expect(paramIndex).toBeGreaterThan(-1);
      expect(call.args[paramIndex + 1]).toBe("version=1.0.0");
      expect(call.args[paramIndex + 2]).toBe("singleFile=true");
      expect(call.args[paramIndex + 3]).toBe("title=API");
    });

    it("should not pass --param flag when no params provided", () => {
      const run = createRun({ options: { params: [] } });

      fromTemplate(run);

      const call = getSpawnCall("inherit");
      expect(call.args).not.toContain("--param");
    });

    it("should use ignore stdio when globals.silent is true", () => {
      const run = createRun({ globals: { quiet: false, silent: true } });

      fromTemplate(run);
      getSpawnCall("ignore");
    });

    it("should suppress wrapper logging when quiet", () => {
      const logSpy = vi.spyOn(console, "log");

      const run = createRun({ globals: { quiet: true, silent: false } });

      fromTemplate(run);

      expect(logSpy).not.toHaveBeenCalled();
    });

    it("should show wrapper logging when not quiet", () => {
      const logSpy = vi.spyOn(console, "log");

      const run = createRun({ globals: { quiet: false, silent: false } });

      fromTemplate(run);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("AsyncAPI generate fromTemplate"),
      );
    });

    it("should forward passthrough args to asyncapi", () => {
      const run = createRun({
        passthrough: ["--debug"],
      });

      fromTemplate(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--debug");
    });

    it("should return non-zero exit code on generation failure", () => {
      vi.mocked(spawnSync).mockReturnValue({
        ...okSpawnResult(),
        status: 1,
      });

      const run = createRun();

      expect(fromTemplate(run)).toBe(1);
    });

    it("should throw when spawnSync errors", () => {
      vi.mocked(spawnSync).mockReturnValue({
        ...okSpawnResult(),
        error: new Error("spawn failed"),
      });

      const run = createRun();

      expect(() => fromTemplate(run)).toThrow("spawn failed");
    });
  });
});
