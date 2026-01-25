import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCli } from "../helper.js";

describe("Redocly Generate-Arazzo Integration Tests", () => {
  const originalCwd = process.cwd();
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(process.cwd(), "test-temp-"));
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe("OpenAPI documents", () => {
    it("should generate Arazzo workflows for simple spec", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = runCli([
        "redocly",
        "generate-arazzo",
        "openapi/openapi.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("arazzo/auto-generated.arazzo.yaml")).toBe(true);

      const arazzo = fs.readFileSync(
        "arazzo/auto-generated.arazzo.yaml",
        "utf-8",
      );
      expect(arazzo).toContain("arazzo:");
      expect(arazzo).toContain("workflows:");
      expect(arazzo).toContain("Simple Test API");
    });

    it("should generate Arazzo workflows for spec with references", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/spec-with-refs"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = runCli([
        "redocly",
        "generate-arazzo",
        "openapi/openapi.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("arazzo/auto-generated.arazzo.yaml")).toBe(true);

      const arazzo = fs.readFileSync(
        "arazzo/auto-generated.arazzo.yaml",
        "utf-8",
      );
      expect(arazzo).toContain("arazzo:");
      expect(arazzo).toContain("workflows:");
      expect(arazzo).toContain("Test API with References");
    });
  });

  describe("default input handling", () => {
    it("should use default input path when no argument provided", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = runCli(["redocly", "generate-arazzo", "--silent"]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("arazzo/auto-generated.arazzo.yaml")).toBe(true);
    });

    it("should fail when no input provided and default doesn't exist", () => {
      const result = runCli(["redocly", "generate-arazzo", "--silent"]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("no input document specified");
    });
  });

  describe("custom options", () => {
    it("should work with custom input path", () => {
      fs.mkdirSync(path.join(tempDir, "custom"), { recursive: true });
      fs.copyFileSync(
        path.join(
          originalCwd,
          "test/fixtures/openapi/valid/simple-spec/openapi.yaml",
        ),
        path.join(tempDir, "custom/spec.yaml"),
      );

      const result = runCli([
        "redocly",
        "generate-arazzo",
        "custom/spec.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("arazzo/auto-generated.arazzo.yaml")).toBe(true);
    });

    it("should work with custom output path", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = runCli([
        "redocly",
        "generate-arazzo",
        "openapi/openapi.yaml",
        "--output",
        "custom-arazzo/workflows.arazzo.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("custom-arazzo/workflows.arazzo.yaml")).toBe(true);
      expect(fs.existsSync("arazzo/auto-generated.arazzo.yaml")).toBe(false);
    });

    it("should work with passthrough args", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      // note: generate-arazzo doesn't have many passthrough options documented
      // this test ensures passthrough mechanism works if they add options in future
      const result = runCli([
        "redocly",
        "generate-arazzo",
        "openapi/openapi.yaml",
        "--silent",
        "--",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("arazzo/auto-generated.arazzo.yaml")).toBe(true);
    });

    it("should respect --cwd flag", () => {
      const subDir = path.join(tempDir, "subdir");
      fs.mkdirSync(subDir, { recursive: true });

      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(subDir, "openapi"),
        { recursive: true },
      );

      const result = runCli([
        "--cwd",
        subDir,
        "redocly",
        "generate-arazzo",
        "openapi/openapi.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(
        fs.existsSync(path.join(subDir, "arazzo/auto-generated.arazzo.yaml")),
      ).toBe(true);
    });
  });
});
