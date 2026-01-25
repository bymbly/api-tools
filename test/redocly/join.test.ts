import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { run } from "../../src/lib/redocly/cli.js";
import { join, Options } from "../../src/lib/redocly/join.js";
import {
  getSpawnCall,
  mockDirent,
  okSpawnResult,
  withDefaults,
} from "../helper.js";

vi.mock("node:child_process");

const createRun = withDefaults<string[], Options>(
  ["first.yaml", "second.yaml"],
  {
    output: "dist/joined/openapi.yaml",
    prefixTagsWithFilename: false,
    withoutXTagGroups: false,
  },
);

describe("Redocly Join Functions", () => {
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
        ["join", "first.yaml", "second.yaml", "--output", "joined.yaml"],
        "inherit",
      );

      expect(exitCode).toBe(0);
      const call = getSpawnCall("inherit");
      expect(call.args).toEqual(
        expect.arrayContaining([
          "join",
          "first.yaml",
          "second.yaml",
          "--output",
          "joined.yaml",
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

      const exitCode = run(["join", "bad.yaml", "worse.yaml"], "inherit");
      expect(exitCode).toBe(2);
    });
  });

  describe("join", () => {
    it("should join multiple API documents", () => {
      const run = createRun();

      expect(join(run)).toBe(0);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("join");
      expect(call.args).toContain("first.yaml");
      expect(call.args).toContain("second.yaml");
    });

    it("should use custom output when provided", () => {
      const run = createRun({ options: { output: "custom/joined.yaml" } });

      join(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--output");
      expect(call.args).toContain("custom/joined.yaml");
    });

    it("should pass prefix-components-with-info-prop option", () => {
      const run = createRun({
        options: { prefixComponentsWithInfoProp: "version" },
      });

      join(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--prefix-components-with-info-prop");
      expect(call.args).toContain("version");
    });

    it("should pass prefix-tags-with-info-prop option", () => {
      const run = createRun({ options: { prefixTagsWithInfoProp: "title" } });

      join(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--prefix-tags-with-info-prop");
      expect(call.args).toContain("title");
    });

    it("should pass prefix-tags-with-filename flag when true", () => {
      const run = createRun({ options: { prefixTagsWithFilename: true } });

      join(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--prefix-tags-with-filename");
    });

    it("should not pass prefix-tags-with-filename flag when false", () => {
      const run = createRun({ options: { prefixTagsWithFilename: false } });

      join(run);

      const call = getSpawnCall("inherit");
      expect(call.args).not.toContain("--prefix-tags-with-filename");
    });

    it("should pass without-x-tag-groups flag when true", () => {
      const run = createRun({ options: { withoutXTagGroups: true } });

      join(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--without-x-tag-groups");
    });

    it("should not pass without-x-tag-groups flag when false", () => {
      const run = createRun({ options: { withoutXTagGroups: false } });

      join(run);

      const call = getSpawnCall("inherit");
      expect(call.args).not.toContain("--without-x-tag-groups");
    });

    it("should use CLI-provided config when specified", () => {
      const run = createRun({ options: { config: "custom/redocly.yaml" } });

      join(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--config");
      expect(call.args).toContain("custom/redocly.yaml");
    });

    it("should not pass config when local config exists", () => {
      vi.spyOn(fs, "readdirSync").mockReturnValue([mockDirent("redocly.yaml")]);

      const run = createRun();

      join(run);

      const call = getSpawnCall("inherit");
      expect(call.args).not.toContain("--config");
    });

    it("should use bundled config when no local config", () => {
      const run = createRun();

      join(run);

      const call = getSpawnCall("inherit");
      const configIndex = call.args.indexOf("--config");
      expect(call.args[configIndex + 1]).toContain("defaults/redocly.yaml");
    });

    it("should use ignore stdio when globals.silent is true", () => {
      const run = createRun({ globals: { quiet: false, silent: true } });

      join(run);
      getSpawnCall("ignore");
    });

    it("should suppress wrapper logging when quiet", () => {
      const logSpy = vi.spyOn(console, "log");

      const run = createRun({ globals: { quiet: true, silent: false } });

      join(run);

      expect(logSpy).not.toHaveBeenCalled();
    });

    it("should show wrapper logging when not quiet", () => {
      const logSpy = vi.spyOn(console, "log");

      const run = createRun({ globals: { quiet: false, silent: false } });

      join(run);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("Redocly join"),
      );
    });

    it("should log all inputs", () => {
      const logSpy = vi.spyOn(console, "log");

      const run = createRun({
        inputs: ["first.yaml", "second.yaml", "third.yaml"],
        globals: { quiet: false, silent: false },
      });

      join(run);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("Inputs: first.yaml, second.yaml, third.yaml"),
      );
    });

    it("should log output when provided", () => {
      const logSpy = vi.spyOn(console, "log");

      const run = createRun({
        options: { output: "custom/output.yaml" },
        globals: { quiet: false, silent: false },
      });

      join(run);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("Output: custom/output.yaml"),
      );
    });

    it("should forward passthrough args to redocly", () => {
      const run = createRun({
        passthrough: ["--lint-config", "error"],
      });

      join(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--lint-config");
      expect(call.args).toContain("error");
    });

    it("should return non-zero exit code on join failure", () => {
      vi.mocked(spawnSync).mockReturnValue({
        ...okSpawnResult(),
        status: 1,
      });

      const run = createRun();

      expect(join(run)).toBe(1);
    });

    it("should throw when spawnSync errors", () => {
      vi.mocked(spawnSync).mockReturnValue({
        ...okSpawnResult(),
        error: new Error("spawn failed"),
      });

      const run = createRun();

      expect(() => join(run)).toThrow("spawn failed");
    });
  });
});
