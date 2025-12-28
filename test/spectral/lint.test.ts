import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getOptions, lint } from "../../src/lib/spectral/lint.js";
import { getSpawnCall } from "../helper.js";

vi.mock("node:child_process");

function okSpawnResult() {
  return {
    pid: 123,
    output: [],
    stdout: Buffer.from(""),
    stderr: Buffer.from(""),
    status: 0,
    signal: null,
    error: undefined,
  } as any;
}

describe("Lint Functions", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(fs, "readdirSync").mockReturnValue([] as any);
    vi.mocked(spawnSync).mockReturnValue(okSpawnResult());
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("getOptions", () => {
    it("should return default options when no env vars are set", () => {
      const options = getOptions();

      expect(options.input).toBe("openapi/openapi.yaml");
      expect(options.format).toBe("stylish");
      expect(options.output).toBeUndefined();
      expect(options.ruleset.path).toContain("defaults/spectral.yaml");
      expect(options.ruleset.source).toBe("bundled");
      expect(options.failSeverity).toBe("warn");
      expect(options.displayOnlyFailures).toBe(false);
      expect(options.verbose).toBe(false);
    });

    it("should use OPENAPI_INPUT env var when set", () => {
      process.env.OPENAPI_INPUT = "api/spec.yaml";
      expect(getOptions().input).toBe("api/spec.yaml");
    });

    it("should use SPECTRAL_FORMAT env var when set", () => {
      process.env.SPECTRAL_FORMAT = "github-actions";
      expect(getOptions().format).toBe("github-actions");
    });

    it("should use OPENAPI_OUTPUT env var when set", () => {
      process.env.OPENAPI_OUTPUT = "lint-results.txt";
      expect(getOptions().output).toBe("lint-results.txt");
    });

    it("should use OPENAPI_CONFIG env var when set", () => {
      process.env.OPENAPI_CONFIG = ".config/spectral.yaml";
      expect(getOptions().ruleset).toEqual({
        path: ".config/spectral.yaml",
        source: "env",
      });
    });

    it("should mark ruleset source as local when local config exists", () => {
      vi.spyOn(fs, "readdirSync").mockReturnValue([
        { isFile: () => true, name: ".spectral.yaml" },
      ] as any);

      const options = getOptions();

      expect(options.ruleset.path).toBeUndefined();
      expect(options.ruleset.source).toBe("local");
    });

    it("should use SPECTRAL_FAIL_SEVERITY env var when set", () => {
      process.env.SPECTRAL_FAIL_SEVERITY = "info";
      expect(getOptions().failSeverity).toBe("info");
    });

    it("should use SPECTRAL_DISPLAY_ONLY_FAILURES env var when set to true", () => {
      process.env.SPECTRAL_DISPLAY_ONLY_FAILURES = "true";
      expect(getOptions().displayOnlyFailures).toBe(true);
    });

    it("should use SPECTRAL_VERBOSE env var when set to true", () => {
      process.env.SPECTRAL_VERBOSE = "true";
      expect(getOptions().verbose).toBe(true);
    });

    it("should default to stylish format when SPECTRAL_FORMAT is invalid", () => {
      process.env.SPECTRAL_FORMAT = "invalid-format";
      expect(getOptions().format).toBe("stylish");
    });

    it("should default to warn failSeverity when SPECTRAL_FAIL_SEVERITY is invalid", () => {
      process.env.SPECTRAL_FAIL_SEVERITY = "invalid-severity";
      expect(getOptions().failSeverity).toBe("warn");
    });

    it("should handle all environment variables together", () => {
      process.env.OPENAPI_INPUT = "custom/spec.yaml";
      process.env.SPECTRAL_FORMAT = "json";
      process.env.OPENAPI_OUTPUT = "results.json";
      process.env.OPENAPI_CONFIG = "custom/spectral.yaml";
      process.env.SPECTRAL_FAIL_SEVERITY = "error";
      process.env.SPECTRAL_DISPLAY_ONLY_FAILURES = "true";
      process.env.SPECTRAL_VERBOSE = "true";

      const options = getOptions();

      expect(options).toEqual({
        input: "custom/spec.yaml",
        format: "json",
        output: "results.json",
        ruleset: { path: "custom/spectral.yaml", source: "env" },
        failSeverity: "error",
        displayOnlyFailures: true,
        verbose: true,
      });
    });
  });

  describe("lint", () => {
    it("should call spawnSync with correct args (defaults)", () => {
      expect(lint()).toBe(0);

      const call = getSpawnCall("inherit");

      expect(call.args[1]).toBe("lint");
      expect(call.args[2]).toBe("openapi/openapi.yaml");

      expect(call.args).toContain("--format");
      expect(call.args).toContain("stylish");

      expect(call.args).toContain("--fail-severity");
      expect(call.args).toContain("warn");

      expect(call.args).toContain("--ruleset");
      const rulesetIndex = call.args.indexOf("--ruleset");
      expect(call.args[rulesetIndex + 1]).toContain("defaults/spectral.yaml");
    });

    it("should use custom options from env vars", () => {
      process.env.OPENAPI_INPUT = "api/spec.yaml";
      process.env.SPECTRAL_FORMAT = "json";
      process.env.OPENAPI_OUTPUT = "lint-results.json";
      process.env.OPENAPI_CONFIG = ".config/spectral.yaml";
      process.env.SPECTRAL_FAIL_SEVERITY = "warn";
      process.env.SPECTRAL_DISPLAY_ONLY_FAILURES = "true";
      process.env.SPECTRAL_VERBOSE = "true";

      expect(lint()).toBe(0);

      const call = getSpawnCall("inherit");
      expect(call.args).toEqual(
        expect.arrayContaining([
          expect.any(String), // spectral binary path
          "lint",
          "api/spec.yaml",
          "--format",
          "json",
          "--fail-severity",
          "warn",
          "--ruleset",
          ".config/spectral.yaml",
          "--output",
          "lint-results.json",
          "--display-only-failures",
          "--verbose",
        ]),
      );
    });

    it("should not use --ruleset when local config is found", () => {
      delete process.env.OPENAPI_CONFIG;

      vi.spyOn(fs, "readdirSync").mockReturnValue([
        { isFile: () => true, name: ".spectral.yaml" },
      ] as any);

      expect(lint()).toBe(0);

      const call = getSpawnCall("inherit");
      expect(call.args).not.toContain("--ruleset");
    });

    it("should use stdio to ignore when SPECTRAL_STDIO=silent", () => {
      process.env.SPECTRAL_STDIO = "silent";

      expect(lint()).toBe(0);

      getSpawnCall("ignore");
    });

    it("should exit with status code when linting fails (non-zero)", () => {
      vi.mocked(spawnSync).mockReturnValue({
        ...okSpawnResult(),
        status: 2,
      });

      expect(lint()).toBe(2);
    });

    it("should throw when spawnSync returns an error", () => {
      vi.mocked(spawnSync).mockReturnValue({
        ...okSpawnResult(),
        error: new Error("boom"),
      });

      expect(() => lint()).toThrow("boom");
    });
  });
});
