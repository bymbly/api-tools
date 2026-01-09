import { execSync } from "child_process";
import fs from "fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  generateArazzo,
  getOptions,
} from "../../src/lib/redocly/generate-arazzo.js";

vi.mock("fs");
vi.mock("child_process");

describe("Generate Arazzo Functions", () => {
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
        output: "dist/auto-generated.arazzo.yaml",
      });
    });

    it("should use OPENAPI_INPUT env var when set", () => {
      process.env.OPENAPI_INPUT = "custom/path/spec.yaml";

      const options = getOptions();

      expect(options.input).toBe("custom/path/spec.yaml");
    });

    it("should use OPENAPI_OUTPUT env var when set", () => {
      process.env.OPENAPI_OUTPUT = "custom/dist/custom.arazzo.yaml";

      const options = getOptions();

      expect(options.output).toBe("custom/dist/custom.arazzo.yaml");
    });

    it("should handle all env vars being set", () => {
      process.env.OPENAPI_INPUT = "custom/path/spec.yaml";
      process.env.OPENAPI_OUTPUT = "custom/dist/custom.arazzo.yaml";

      const options = getOptions();

      expect(options).toEqual({
        input: "custom/path/spec.yaml",
        output: "custom/dist/custom.arazzo.yaml",
      });
    });
  });

  describe("generateArazzo", () => {
    beforeEach(() => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(execSync).mockReturnValue(Buffer.from(""));
    });

    it("should call execSync with correct command", () => {
      generateArazzo();

      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining(
          "npx --no @redocly/cli generate-arazzo openapi/openapi.yaml --output-file dist/auto-generated.arazzo.yaml",
        ),
        { stdio: "inherit" },
      );
    });

    it("should create output directory before generation", () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const mkdirSpy = vi
        .spyOn(fs, "mkdirSync")
        .mockImplementation(() => undefined);

      generateArazzo();

      expect(mkdirSpy).toHaveBeenCalledWith("dist", { recursive: true });
    });

    it("should use custom environment variables", () => {
      process.env.OPENAPI_INPUT = "custom/path/spec.yaml";
      process.env.OPENAPI_OUTPUT = "custom/dist/custom.arazzo.yaml";

      generateArazzo();

      const command = vi.mocked(execSync).mock.calls[0][0];
      expect(command).toContain("custom/path/spec.yaml");
      expect(command).toContain("custom/dist/custom.arazzo.yaml");
    });

    it("should exit process with code 1 on generation failure", () => {
      const mockExit = vi
        .spyOn(process, "exit")
        .mockImplementation(() => undefined as never);
      const mockError = vi
        .spyOn(console, "error")
        .mockImplementation(() => vi.fn());

      vi.mocked(execSync).mockImplementation(() => {
        throw new Error("Generation failed");
      });

      generateArazzo();

      expect(mockExit).toHaveBeenCalledWith(1);
      expect(mockError).toHaveBeenCalledWith("❌ Arazzo generation failed!");

      mockExit.mockRestore();
      mockError.mockRestore();
    });
  });
});
