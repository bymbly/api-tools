import { execSync } from "child_process";
import fs from "fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getOptions, respect } from "../../src/lib/redocly/respect.js";

vi.mock("fs");
vi.mock("child_process");

describe("Respect Functions", () => {
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
        files: "arazzo/*.arazzo.yaml",
        verbose: false,
        harOutput: undefined,
        jsonOutput: undefined,
      });
    });

    it("should use ARAZZO_INPUT env var when set", () => {
      process.env.ARAZZO_INPUT = "custom/path/*.arazzo.yaml";

      const options = getOptions();

      expect(options.files).toBe("custom/path/*.arazzo.yaml");
    });

    it("should use ARAZZO_VERBOSE env var when set to true", () => {
      process.env.ARAZZO_VERBOSE = "true";

      const options = getOptions();

      expect(options.verbose).toBe(true);
    });

    it("should use ARAZZO_HAR_OUTPUT env var when set", () => {
      process.env.ARAZZO_HAR_OUTPUT = "output.har";

      const options = getOptions();

      expect(options.harOutput).toBe("output.har");
    });

    it("should use ARAZZO_JSON_OUTPUT env var when set", () => {
      process.env.ARAZZO_JSON_OUTPUT = "output.json";

      const options = getOptions();

      expect(options.jsonOutput).toBe("output.json");
    });

    it("should handle all env vars being set", () => {
      process.env.ARAZZO_INPUT = "custom/path/*.arazzo.yaml";
      process.env.ARAZZO_VERBOSE = "true";
      process.env.ARAZZO_HAR_OUTPUT = "output.har";
      process.env.ARAZZO_JSON_OUTPUT = "output.json";

      const options = getOptions();

      expect(options).toEqual({
        files: "custom/path/*.arazzo.yaml",
        verbose: true,
        harOutput: "output.har",
        jsonOutput: "output.json",
      });
    });
  });

  describe("respect", () => {
    beforeEach(() => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(execSync).mockReturnValue(Buffer.from(""));
    });

    it("should call execSync with correct command", () => {
      respect();

      expect(execSync).toHaveBeenCalledWith(
        "npx --no @redocly/cli respect arazzo/*.arazzo.yaml",
        { stdio: "inherit" },
      );
    });

    it("should include verbose flag when ARAZZO_VERBOSE is true", () => {
      process.env.ARAZZO_VERBOSE = "true";

      respect();

      expect(execSync).toHaveBeenCalledWith(
        "npx --no @redocly/cli respect arazzo/*.arazzo.yaml --verbose",
        { stdio: "inherit" },
      );
    });

    it("should include har-output when set", () => {
      process.env.ARAZZO_HAR_OUTPUT = "output.har";

      respect();

      expect(execSync).toHaveBeenCalledWith(
        "npx --no @redocly/cli respect arazzo/*.arazzo.yaml --har-output output.har",
        { stdio: "inherit" },
      );
    });

    it("should include json-output when set", () => {
      process.env.ARAZZO_JSON_OUTPUT = "output.json";

      respect();

      expect(execSync).toHaveBeenCalledWith(
        "npx --no @redocly/cli respect arazzo/*.arazzo.yaml --json-output output.json",
        { stdio: "inherit" },
      );
    });

    it("should handle all options together", () => {
      process.env.ARAZZO_VERBOSE = "true";
      process.env.ARAZZO_HAR_OUTPUT = "output.har";
      process.env.ARAZZO_JSON_OUTPUT = "output.json";

      respect();

      expect(execSync).toHaveBeenCalledWith(
        "npx --no @redocly/cli respect arazzo/*.arazzo.yaml --verbose --har-output output.har --json-output output.json",
        { stdio: "inherit" },
      );
    });

    it("should exit process with code 1 on error", () => {
      const mockExit = vi
        .spyOn(process, "exit")
        .mockImplementation(() => undefined as never);
      const mockError = vi
        .spyOn(console, "error")
        .mockImplementation(() => vi.fn());

      vi.mocked(execSync).mockImplementation(() => {
        throw new Error("Command failed");
      });

      respect();

      expect(mockError).toHaveBeenCalledWith("❌ Arazzo workflows failed!");
      expect(mockError).toHaveBeenCalledWith("Command failed");
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
      mockError.mockRestore();
    });
  });
});
