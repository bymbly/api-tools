import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getOptions, lint } from "../../src/lib/spectral/lint.js";
import { getExecCommand } from "../helper.js";

vi.mock("child_process");

describe("Lint Functions", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
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
      expect(options.failSeverity).toBe("warn");
      expect(options.displayOnlyFailures).toBe(false);
      expect(options.verbose).toBe(false);
    });

    it("should use OPENAPI_INPUT env var when set", () => {
      process.env.OPENAPI_INPUT = "api/spec.yaml";

      const options = getOptions();

      expect(options.input).toBe("api/spec.yaml");
    });

    it("should use SPECTRAL_FORMAT env var when set", () => {
      process.env.SPECTRAL_FORMAT = "github-actions";

      const options = getOptions();

      expect(options.format).toBe("github-actions");
    });

    it("should use OPENAPI_OUTPUT env var when set", () => {
      process.env.OPENAPI_OUTPUT = "lint-results.txt";

      const options = getOptions();

      expect(options.output).toBe("lint-results.txt");
    });

    it("should use OPENAPI_CONFIG env var when set", () => {
      process.env.OPENAPI_CONFIG = ".config/spectral.yaml";

      const options = getOptions();

      expect(options.ruleset.path).toBe(".config/spectral.yaml");
    });

    it("should mark ruleset source as bundled by default", () => {
      const options = getOptions();

      expect(options.ruleset.source).toBe("bundled");
    });

    it("should use SPECTRAL_FAIL_SEVERITY env var when set", () => {
      process.env.SPECTRAL_FAIL_SEVERITY = "info";

      const options = getOptions();

      expect(options.failSeverity).toBe("info");
    });

    it("should use SPECTRAL_DISPLAY_ONLY_FAILURES env var when set to true", () => {
      process.env.SPECTRAL_DISPLAY_ONLY_FAILURES = "true";

      const options = getOptions();

      expect(options.displayOnlyFailures).toBe(true);
    });

    it("should use SPECTRAL_VERBOSE env var when set to true", () => {
      process.env.SPECTRAL_VERBOSE = "true";

      const options = getOptions();

      expect(options.verbose).toBe(true);
    });

    it("should default to stylish format when SPECTRAL_FORMAT is invalid", () => {
      process.env.SPECTRAL_FORMAT = "invalid-format";

      const options = getOptions();

      expect(options.format).toBe("stylish");
    });

    it("should default to warn failSeverity when SPECTRAL_FAIL_SEVERITY is invalid", () => {
      process.env.SPECTRAL_FAIL_SEVERITY = "invalid-severity";

      const options = getOptions();

      expect(options.failSeverity).toBe("warn");
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
    beforeEach(() => {
      vi.mocked(execSync).mockReturnValue(Buffer.from(""));
    });

    it("should call execSync with correct command", () => {
      lint();

      const cmd = getExecCommand();

      expect(cmd).toContain(
        "npx --no @stoplight/spectral-cli lint openapi/openapi.yaml",
      );
      expect(cmd).toContain("--format stylish");
      expect(cmd).toContain(
        `--ruleset ${path.join(__dirname, "../../defaults/spectral.yaml")}`,
      );
      expect(cmd).toContain("--fail-severity warn");
    });

    it("should use custom options from env vars", () => {
      process.env.OPENAPI_INPUT = "api/spec.yaml";
      process.env.SPECTRAL_FORMAT = "json";
      process.env.OPENAPI_OUTPUT = "lint-results.json";
      process.env.OPENAPI_CONFIG = ".config/spectral.yaml";
      process.env.SPECTRAL_FAIL_SEVERITY = "warn";
      process.env.SPECTRAL_DISPLAY_ONLY_FAILURES = "true";
      process.env.SPECTRAL_VERBOSE = "true";

      lint();

      const cmd = getExecCommand();

      expect(cmd).toContain(
        "npx --no @stoplight/spectral-cli lint api/spec.yaml",
      );
      expect(cmd).toContain("--format json");
      expect(cmd).toContain("--output lint-results.json");
      expect(cmd).toContain("--ruleset .config/spectral.yaml");
      expect(cmd).toContain("--fail-severity warn");
      expect(cmd).toContain("--display-only-failures");
      expect(cmd).toContain("--verbose");
    });

    it("should use --format from env when format is set", () => {
      process.env.SPECTRAL_FORMAT = "junit";

      lint();

      expect(getExecCommand()).toContain("--format junit");
    });

    it("should default to --format stylish when not set", () => {
      lint();

      expect(getExecCommand()).toContain("--format stylish");
    });

    it("should include --output flag only when output is set", () => {
      process.env.OPENAPI_OUTPUT = "lint-results.json";

      lint();

      expect(getExecCommand()).toContain("--output lint-results.json");
    });

    it("should not include --output flag when output is not set", () => {
      lint();

      expect(getExecCommand()).not.toContain("--output");
    });

    it("should include --ruleset flag when ruleset is set", () => {
      process.env.OPENAPI_CONFIG = ".config/spectral.yaml";

      lint();

      expect(getExecCommand()).toContain("--ruleset .config/spectral.yaml");
    });

    it("should include default ruleset when no local config is found", () => {
      lint();

      expect(getExecCommand()).toContain(
        `--ruleset ${path.join(__dirname, "../../defaults/spectral.yaml")}`,
      );
    });

    it("should not include --ruleset flag when local config is found", () => {
      delete process.env.OPENAPI_CONFIG;
      vi.spyOn(fs, "readdirSync").mockReturnValue([".spectral.yaml"] as any);

      lint();

      expect(getExecCommand()).not.toContain("--ruleset");
    });

    it("should include --fail-severity flag when set", () => {
      process.env.SPECTRAL_FAIL_SEVERITY = "error";

      lint();

      expect(getExecCommand()).toContain("--fail-severity error");
    });

    it("should default to --fail-severity warn when not set", () => {
      lint();

      expect(getExecCommand()).toContain("--fail-severity warn");
    });

    it("should include --display-only-failures flag when set to true", () => {
      process.env.SPECTRAL_DISPLAY_ONLY_FAILURES = "true";

      lint();

      expect(getExecCommand()).toContain("--display-only-failures");
    });

    it("should not include --display-only-failures flag when set to false", () => {
      lint();

      expect(getExecCommand()).not.toContain("--display-only-failures");
    });

    it("should include --verbose flag when set to true", () => {
      process.env.SPECTRAL_VERBOSE = "true";

      lint();

      expect(getExecCommand()).toContain("--verbose");
    });

    it("should not include --verbose flag when set to false", () => {
      lint();

      expect(getExecCommand()).not.toContain("--verbose");
    });

    it("should exit with status 1 when linting fails", () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error("Linting failed");
      });

      const errorSpy = vi.spyOn(console, "error");

      const exitError = new Error("Exit");
      const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
        throw exitError;
      });

      expect(() => lint()).toThrow(exitError);
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Linting failed"),
      );
    });
  });
});
