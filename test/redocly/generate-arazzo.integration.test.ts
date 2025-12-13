import fs from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateArazzo } from "../../src/lib/redocly/generate-arazzo.js";

describe("Generate Arazzo Integration Tests", () => {
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
    it("should generate Arazzo workflows for simple spec", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        {
          recursive: true,
        },
      );

      generateArazzo();

      expect(fs.existsSync("dist/auto-generated.arazzo.yaml")).toBe(true);

      const arazzoYaml = fs.readFileSync(
        "dist/auto-generated.arazzo.yaml",
        "utf-8",
      );

      expect(arazzoYaml).toContain("workflows:");
      expect(arazzoYaml).toContain("Simple Test API");
    });

    it("should generate Arazzo workflows for spec with references", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/valid/spec-with-refs"),
        path.join(tempDir, "openapi"),
        {
          recursive: true,
        },
      );

      generateArazzo();

      expect(fs.existsSync("dist/auto-generated.arazzo.yaml")).toBe(true);

      const arazzoYaml = fs.readFileSync(
        "dist/auto-generated.arazzo.yaml",
        "utf-8",
      );

      expect(arazzoYaml).toContain("workflows:");
      expect(arazzoYaml).toContain("Test API with References");
    });
  });

  describe("invalid specs", () => {
    it("should fail for nonexistent file", () => {
      process.env.OPENAPI_INPUT = "openapi/nonexistent.yaml";

      const mockExit = vi
        .spyOn(process, "exit")
        .mockImplementation(() => undefined as never);

      generateArazzo();

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });
  });

  describe("custom configurations", () => {
    it("should generate Arazzo workflows with custom input path", () => {
      fs.mkdirSync(path.join(tempDir, "custom"));
      fs.copyFileSync(
        path.join(originalCwd, "test/fixtures/valid/simple-spec/openapi.yaml"),
        path.join(tempDir, "custom", "spec.yaml"),
      );

      process.env.OPENAPI_INPUT = "custom/spec.yaml";

      generateArazzo();

      expect(fs.existsSync("dist/auto-generated.arazzo.yaml")).toBe(true);
    });

    it("should generate Arazzo workflows with custom output path", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        {
          recursive: true,
        },
      );

      process.env.OPENAPI_OUTPUT = "custom-dist/custom.arazzo.yaml";

      generateArazzo();

      expect(fs.existsSync("custom-dist/custom.arazzo.yaml")).toBe(true);
    });
  });
});
