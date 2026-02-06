import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCli } from "../helper.js";

describe("AsyncAPI Lint Integration Tests", () => {
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

  describe("AsyncAPI documents", () => {
    it("should pass for simple valid AsyncAPI spec", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli([
        "asyncapi",
        "lint",
        "asyncapi/asyncapi.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
    });

    it("should fail for invalid AsyncAPI spec", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/invalid/broken-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli([
        "asyncapi",
        "lint",
        "asyncapi/asyncapi.yaml",
        "--silent",
      ]);

      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("default input handling", () => {
    it("should use default input path when no argument provided", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli(["asyncapi", "lint", "--silent"]);

      expect(result.exitCode).toBe(0);
    });

    it("should fail when no input provided and default doesn't exist", () => {
      const result = runCli(["asyncapi", "lint", "--silent"]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("no input document specified");
    });
  });

  describe("output options", () => {
    it("should work with JSON format and output file", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli([
        "asyncapi",
        "lint",
        "asyncapi/asyncapi.yaml",
        "--format",
        "json",
        "--output",
        "lint-results.json",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("lint-results.json")).toBe(true);

      const content = fs.readFileSync("lint-results.json", "utf-8");
      expect(() => JSON.parse(content) as unknown).not.toThrow();
    });
  });

  describe("custom options", () => {
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
        "lint",
        "custom/spec.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
    });

    it("should work with passthrough args", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli([
        "asyncapi",
        "lint",
        "asyncapi/asyncapi.yaml",
        "--silent",
        "--",
        "--score",
      ]);

      expect(result.exitCode).toBe(0);
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
        "lint",
        "asyncapi/asyncapi.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
    });
  });

  describe("raw asyncapi passthrough", () => {
    it("should pass unknown commands directly to asyncapi cli", () => {
      const result = runCli(["asyncapi", "--", "--help"]);
      expect(result.stdout).toContain("VERSION");
      expect(result.stdout).toContain("USAGE");
    });

    it("should show help when no args provided", () => {
      const result = runCli(["asyncapi"]);
      expect(result.stdout).toContain("AsyncAPI-related commands");
    });
  });
});
