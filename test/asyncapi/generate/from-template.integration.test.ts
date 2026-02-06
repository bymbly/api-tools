import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCli } from "../../helper.js";

describe("AsyncAPI From-Template Integration Tests", () => {
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

  describe("HTML template generation", { timeout: 60_000 }, () => {
    it("should generate HTML documentation from simple spec", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli([
        "asyncapi",
        "generate",
        "from-template",
        "@asyncapi/html-template",
        "asyncapi/asyncapi.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/generated")).toBe(true);

      // html template generates index.html, css/* and js/* files
      const generatedFiles = fs.readdirSync("dist/generated");
      expect(generatedFiles.length).toBeGreaterThan(0);
    });
  });

  describe("default input handling", { timeout: 60_000 }, () => {
    it("should use default input path when no argument provided", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli([
        "asyncapi",
        "generate",
        "from-template",
        "@asyncapi/html-template",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/generated")).toBe(true);
    });

    it("should fail when no input provided and default doesn't exist", () => {
      const result = runCli([
        "asyncapi",
        "generate",
        "from-template",
        "@asyncapi/html-template",
        "--silent",
      ]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("no input document specified");
    });
  });

  describe("output options", { timeout: 60_000 }, () => {
    it("should work with custom output path", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli([
        "asyncapi",
        "generate",
        "from-template",
        "@asyncapi/html-template",
        "--output",
        "custom/docs",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("custom/docs")).toBe(true);
      expect(fs.existsSync("dist/generated")).toBe(false);
    });

    it("should work with template parameters", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli([
        "asyncapi",
        "generate",
        "from-template",
        "@asyncapi/html-template",
        "--params",
        "singleFile=true",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/generated")).toBe(true);
    });

    it("should work with multiple template parameters", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli([
        "asyncapi",
        "generate",
        "from-template",
        "@asyncapi/html-template",
        "--params",
        "singleFile=true",
        "--params",
        "version=1.0.0",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/generated")).toBe(true);
    });

    it("should overwrite files with --force-write", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      // first generation
      runCli([
        "asyncapi",
        "generate",
        "from-template",
        "@asyncapi/html-template",
        "--silent",
      ]);

      // second generation with force-write
      const result = runCli([
        "asyncapi",
        "generate",
        "from-template",
        "@asyncapi/html-template",
        "--force-write",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
    });
  });

  describe("custom options", { timeout: 60_000 }, () => {
    it("should work with custom input path", () => {
      fs.mkdirSync(path.join(tempDir, "custom"), { recursive: true });
      fs.copyFileSync(
        path.join(
          originalCwd,
          "test/fixtures/asyncapi/valid/simple-spec/asyncapi.yaml",
        ),
        path.join(tempDir, "custom/spec.yaml"),
      );

      const result = runCli([
        "asyncapi",
        "generate",
        "from-template",
        "@asyncapi/html-template",
        "custom/spec.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/generated")).toBe(true);
    });

    it("should work with passthrough args", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli([
        "asyncapi",
        "generate",
        "from-template",
        "@asyncapi/html-template",
        "asyncapi/asyncapi.yaml", // if we do not provide an input, commander gets confused
        "--silent",
        "--",
        "--help",
      ]);

      expect(result.exitCode).toBe(0);
    });

    it("should block passthrough args without input file", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli([
        "asyncapi",
        "generate",
        "from-template",
        "@asyncapi/html-template",
        "--silent",
        "--",
        "--help",
      ]);

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain(
        "Cannot use passthrough arguments without specifying an input file",
      );
    });

    it("should respect --cwd flag", () => {
      const subDir = path.join(tempDir, "subdir");
      fs.mkdirSync(subDir, { recursive: true });

      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(subDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli([
        "--cwd",
        subDir,
        "asyncapi",
        "generate",
        "from-template",
        "@asyncapi/html-template",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync(path.join(subDir, "dist/generated"))).toBe(true);
    });
  });
});
