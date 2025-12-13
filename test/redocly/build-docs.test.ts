import { execSync } from "child_process";
import fs from "fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildDocs, getOptions } from "../../src/lib/redocly/build-docs.js";

vi.mock("fs");
vi.mock("child_process");

describe("Build Docs Functions", () => {
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
        output: "dist/openapi.html",
        configPath: undefined,
      });
    });

    it("should use OPENAPI_INPUT env var when set", () => {
      process.env.OPENAPI_INPUT = "custom/path/spec.yaml";

      const options = getOptions();

      expect(options.input).toBe("custom/path/spec.yaml");
    });

    it("should use OPENAPI_OUTPUT env var when set", () => {
      process.env.OPENAPI_OUTPUT = "custom/dist/openapi.html";

      const options = getOptions();

      expect(options.output).toBe("custom/dist/openapi.html");
    });

    it("should use OPENAPI_CONFIG env var when set", () => {
      process.env.OPENAPI_CONFIG = "custom/config/path.json";

      const options = getOptions();

      expect(options.configPath).toBe("custom/config/path.json");
    });

    it("should handle all env vars being set", () => {
      process.env.OPENAPI_INPUT = "custom/path/spec.yaml";
      process.env.OPENAPI_OUTPUT = "custom/dist/openapi.html";
      process.env.OPENAPI_CONFIG = "custom/config/path.json";

      const options = getOptions();

      expect(options).toEqual({
        input: "custom/path/spec.yaml",
        output: "custom/dist/openapi.html",
        configPath: "custom/config/path.json",
      });
    });
  });

  describe("buildDocs", () => {
    beforeEach(() => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(execSync).mockReturnValue(Buffer.from(""));
    });

    it("should call execSync with correct default parameters", () => {
      buildDocs();

      expect(execSync).toHaveBeenCalledWith(
        "npx --no @redocly/cli build-docs openapi/openapi.yaml --output dist/openapi.html",
        { stdio: "inherit" },
      );
    });

    it("should create output directory before bundling", () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const mkdirSpy = vi
        .spyOn(fs, "mkdirSync")
        .mockImplementation(() => undefined);

      buildDocs();

      expect(mkdirSpy).toHaveBeenCalledWith("dist", { recursive: true });
    });

    it("should use custom environment variables", () => {
      process.env.OPENAPI_INPUT = "custom/input.yaml";
      process.env.OPENAPI_OUTPUT = "custom/dist/openapi.html";
      process.env.OPENAPI_CONFIG = "custom/config.yaml";

      buildDocs();

      const command = vi.mocked(execSync).mock.calls[0][0];
      expect(command).toContain("custom/input.yaml");
      expect(command).toContain("custom/dist/openapi.html");
      expect(command).toContain("--config custom/config.yaml");
    });

    it("should include --config flag when configPath is set", () => {
      process.env.OPENAPI_CONFIG = "custom/config.yaml";

      buildDocs();

      const command = vi.mocked(execSync).mock.calls[0][0];
      expect(command).toContain("--config custom/config.yaml");
    });

    it("should not include --config flag when configPath is not set", () => {
      buildDocs();

      const command = vi.mocked(execSync).mock.calls[0][0];
      expect(command).not.toContain("--config");
    });

    it("should exit with status 1 when building fails", () => {
      const mockExit = vi
        .spyOn(process, "exit")
        .mockImplementation(() => undefined as never);
      const mockError = vi.spyOn(console, "error").mockImplementation(() => {});

      vi.mocked(execSync).mockImplementation(() => {
        throw new Error("Building documentation failed");
      });

      buildDocs();

      expect(mockExit).toHaveBeenCalledWith(1);
      expect(mockError).toHaveBeenCalledWith(
        "❌ Building documentation failed!",
      );

      mockExit.mockRestore();
      mockError.mockRestore();
    });
  });
});
