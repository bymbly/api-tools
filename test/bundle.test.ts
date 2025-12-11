import { execSync } from "child_process";
import fs from "fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bundle, getOptions } from "../src/lib/bundle.js";

vi.mock("fs");
vi.mock("child_process");

describe("Bundle Functions", () => {
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
        output: "dist/openapi",
        format: "yaml",
        configPath: undefined,
      });
    });

    it("should use OPENAPI_INPUT env var when set", () => {
      process.env.OPENAPI_INPUT = "custom/path/spec.yaml";

      const options = getOptions();

      expect(options.input).toBe("custom/path/spec.yaml");
    });

    it("should use OPENAPI_OUTPUT env var when set", () => {
      process.env.OPENAPI_OUTPUT = "custom/dist/openapi";

      const options = getOptions();

      expect(options.output).toBe("custom/dist/openapi");
    });

    it("should use OPENAPI_FORMAT env var when set", () => {
      process.env.OPENAPI_FORMAT = "json";

      const options = getOptions();

      expect(options.format).toBe("json");
    });

    it("should default to yaml format when OPENAPI_FORMAT is invalid", () => {
      process.env.OPENAPI_FORMAT = "xml";

      const options = getOptions();

      expect(options.format).toBe("yaml");
    });

    it("should use OPENAPI_CONFIG env var when set", () => {
      process.env.OPENAPI_CONFIG = ".config/redocly.yaml";

      const options = getOptions();

      expect(options.configPath).toBe(".config/redocly.yaml");
    });

    it("should handle all environment variables together", () => {
      process.env.OPENAPI_INPUT = "custom/spec.yaml";
      process.env.OPENAPI_OUTPUT = "custom/dist/openapi";
      process.env.OPENAPI_FORMAT = "json";
      process.env.OPENAPI_CONFIG = "custom/config.yaml";

      const options = getOptions();

      expect(options).toEqual({
        input: "custom/spec.yaml",
        output: "custom/dist/openapi",
        format: "json",
        configPath: "custom/config.yaml",
      });
    });
  });

  describe("bundle", () => {
    beforeEach(() => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(execSync).mockReturnValue(Buffer.from(""));
    });

    it("should call execSync with correct default parameters", () => {
      bundle();

      expect(execSync).toHaveBeenCalledWith(
        "npx --no @redocly/cli bundle openapi/openapi.yaml --output dist/openapi.yaml",
        { stdio: "inherit" },
      );
    });

    it("should create output directory before bundling", () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const mkdirSpy = vi
        .spyOn(fs, "mkdirSync")
        .mockImplementation(() => undefined);

      bundle();

      expect(mkdirSpy).toHaveBeenCalledWith("dist", { recursive: true });
    });

    it("should use custom environment variables", () => {
      process.env.OPENAPI_INPUT = "custom/input.yaml";
      process.env.OPENAPI_OUTPUT = "custom/dist/openapi";
      process.env.OPENAPI_FORMAT = "json";

      bundle();

      const command = vi.mocked(execSync).mock.calls[0][0];
      expect(command).toContain("custom/input.yaml");
      expect(command).toContain("custom/dist/openapi.json");
    });

    it("should include --config flag when configPath is set", () => {
      process.env.OPENAPI_CONFIG = ".config/redocly.yaml";

      bundle();

      const command = vi.mocked(execSync).mock.calls[0][0] as string;
      expect(command).toContain("--config .config/redocly.yaml");
    });

    it("should not include --config flag when configPath is not set", () => {
      bundle();

      const command = vi.mocked(execSync).mock.calls[0][0] as string;
      expect(command).not.toContain("--config");
    });

    it("should exit with status 1 when bundling fails", () => {
      const mockExit = vi
        .spyOn(process, "exit")
        .mockImplementation(() => undefined as never);
      const mockError = vi.spyOn(console, "error").mockImplementation(() => {});

      vi.mocked(execSync).mockImplementation(() => {
        throw new Error("Bundling failed");
      });

      bundle();

      expect(mockExit).toHaveBeenCalledWith(1);
      expect(mockError).toHaveBeenCalledWith("❌ Bundling failed!");

      mockExit.mockRestore();
      mockError.mockRestore();
    });
  });
});
