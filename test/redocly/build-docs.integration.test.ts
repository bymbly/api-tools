import fs from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildDocs } from "../../src/lib/redocly/build-docs.js";

describe("Build Docs Integration Tests", () => {
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
    it("should build docs for simple spec", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        {
          recursive: true,
        },
      );

      buildDocs();

      expect(fs.existsSync("dist/openapi.html")).toBe(true);

      const html = fs.readFileSync("dist/openapi.html", "utf-8");

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("Simple Test API");
    });

    it("should build docs for spec with references", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/spec-with-refs"),
        path.join(tempDir, "openapi"),
        {
          recursive: true,
        },
      );

      buildDocs();

      expect(fs.existsSync("dist/openapi.html")).toBe(true);

      const html = fs.readFileSync("dist/openapi.html", "utf-8");

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("Test API with References");
      expect(html).toContain("TestSchema");
    });
  });

  describe("invalid specs", () => {
    it("should fail for nonexistent file", () => {
      process.env.OPENAPI_INPUT = "openapi/nonexistent.yaml";

      const mockExit = vi
        .spyOn(process, "exit")
        .mockImplementation(() => undefined as never);

      buildDocs();

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });
  });

  describe("custom configurations", () => {
    it("should build docs with custom input path", () => {
      fs.mkdirSync(path.join(tempDir, "custom"));
      fs.copyFileSync(
        path.join(
          originalCwd,
          "test/fixtures/openapi/valid/simple-spec/openapi.yaml",
        ),
        path.join(tempDir, "custom/spec.yaml"),
      );

      process.env.OPENAPI_INPUT = "custom/spec.yaml";

      buildDocs();

      expect(fs.existsSync("dist/openapi.html")).toBe(true);
    });

    it("should build docs with custom output path", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        {
          recursive: true,
        },
      );

      process.env.OPENAPI_OUTPUT = "custom-dist/docs.html";

      buildDocs();

      expect(fs.existsSync("custom-dist/docs.html")).toBe(true);
      expect(fs.existsSync("dist/openapi.html")).toBe(false);
    });

    it("should build docs with custom config path", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        {
          recursive: true,
        },
      );

      process.env.OPENAPI_CONFIG = path.join(
        originalCwd,
        "test/fixtures/redocly.yaml",
      );

      expect(() => buildDocs()).not.toThrow();
    });
  });
});
