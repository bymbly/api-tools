import { execSync } from "child_process";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getOptions, lint } from "../../src/lib/redocly/lint.js";

vi.mock("child_process");

describe("Lint Functions", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getOptions", () => {
    it("should return default options when no env vars are set", () => {
      const options = getOptions();

      expect(options).toEqual({
        input: "openapi/openapi.yaml",
        format: "codeframe",
        configPath: undefined,
      });
    });

    it("should use OPENAPI_INPUT env var when set", () => {
      process.env.OPENAPI_INPUT = "api/spec.yaml";

      const options = getOptions();

      expect(options.input).toBe("api/spec.yaml");
    });

    it("should use OPENAPI_FORMAT env var when set", () => {
      process.env.OPENAPI_FORMAT = "github-actions";

      const options = getOptions();

      expect(options.format).toBe("github-actions");
    });

    it("should use OPENAPI_CONFIG env var when set", () => {
      process.env.OPENAPI_CONFIG = ".config/redocly.yaml";

      const options = getOptions();

      expect(options.configPath).toBe(".config/redocly.yaml");
    });

    it("should default to codeframe format when OPENAPI_FORMAT is invalid", () => {
      process.env.OPENAPI_FORMAT = "invalid-format";

      const options = getOptions();

      expect(options.format).toBe("codeframe");
    });

    it("should handle all environment variables together", () => {
      process.env.OPENAPI_INPUT = "custom/spec.yaml";
      process.env.OPENAPI_FORMAT = "json";
      process.env.OPENAPI_CONFIG = "custom/redocly.yaml";

      const options = getOptions();

      expect(options).toEqual({
        input: "custom/spec.yaml",
        format: "json",
        configPath: "custom/redocly.yaml",
      });
    });
  });

  describe("lint", () => {
    beforeEach(() => {
      vi.mocked(execSync).mockReturnValue(Buffer.from(""));
    });

    it("should call execSync with correct default parameters", () => {
      lint();

      expect(execSync).toHaveBeenCalledWith(
        "npx --no @redocly/cli lint openapi/openapi.yaml --format codeframe",
        { stdio: "inherit" },
      );
    });

    it("should use custom environment variables", () => {
      process.env.OPENAPI_INPUT = "api/spec.yaml";
      process.env.OPENAPI_FORMAT = "json";

      lint();

      expect(execSync).toHaveBeenCalledWith(
        "npx --no @redocly/cli lint api/spec.yaml --format json",
        { stdio: "inherit" },
      );
    });

    it("should include --config flag when configPath is set", () => {
      process.env.OPENAPI_CONFIG = ".config/redocly.yaml";

      lint();

      const command = vi.mocked(execSync).mock.calls[0][0];
      expect(command).toContain("--config .config/redocly.yaml");
    });

    it("should not include --config flag when configPath is not set", () => {
      lint();

      const command = vi.mocked(execSync).mock.calls[0][0];
      expect(command).not.toContain("--config");
    });

    it("should exit with status 1 when linting fails", () => {
      const mockExit = vi
        .spyOn(process, "exit")
        .mockImplementation(() => undefined as never);
      const mockError = vi
        .spyOn(console, "error")
        .mockImplementation(() => vi.fn());

      vi.mocked(execSync).mockImplementation(() => {
        throw new Error("Lint failed");
      });

      lint();

      expect(mockExit).toHaveBeenCalledWith(1);
      expect(mockError).toHaveBeenCalledWith("❌ Linting failed!");

      mockExit.mockRestore();
      mockError.mockRestore();
    });
  });
});
