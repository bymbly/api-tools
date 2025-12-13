import fs from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lint } from "../../src/lib/redocly/lint";

describe("Lint Integration Tests", () => {
  const originalEnv = process.env;
  const originalCwd = process.cwd();
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(process.cwd(), "test-temp-"));
    process.chdir(tempDir);
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.chdir(originalCwd);
    process.env = originalEnv;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe("valid specs", () => {
    it("should pass for simple valid spec", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        {
          recursive: true,
        },
      );

      expect(() => lint()).not.toThrow();
    });

    it("should pass for spec with references", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/valid/spec-with-refs"),
        path.join(tempDir, "openapi"),
        {
          recursive: true,
        },
      );

      expect(() => lint()).not.toThrow();
    });
  });

  describe("invalid specs", () => {
    it("should fail invalid spec", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/invalid/broken-spec"),
        path.join(tempDir, "openapi"),
        {
          recursive: true,
        },
      );

      const mockExit = vi
        .spyOn(process, "exit")
        .mockImplementation(() => undefined as never);

      lint();

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });

    it("should fail for nonexistent file", () => {
      process.env.OPENAPI_INPUT = "openapi/nonexistent.yaml";

      const mockExit = vi
        .spyOn(process, "exit")
        .mockImplementation(() => undefined as never);

      lint();

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });
  });

  describe("different configurations", () => {
    it("should work with custom input path", () => {
      fs.mkdirSync(path.join(tempDir, "custom"), { recursive: true });
      fs.copyFileSync(
        path.join(originalCwd, "test/fixtures/valid/simple-spec/openapi.yaml"),
        path.join(tempDir, "custom/spec.yaml"),
      );

      process.env.OPENAPI_INPUT = "custom/spec.yaml";

      expect(() => lint()).not.toThrow();
    });

    it("should work with custom config path", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        {
          recursive: true,
        },
      );

      process.env.OPENAPI_CONFIG = path.join(
        originalCwd,
        "test/fixtures/redocly.yaml",
      );

      expect(() => lint()).not.toThrow();
    });
  });
});
