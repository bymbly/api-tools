import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCli } from "../helper.js";

describe("AsyncAPI Format Integration Tests", () => {
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
    it("should format simple AsyncAPI YAML spec to JSON", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli([
        "asyncapi",
        "format",
        "asyncapi/asyncapi.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/format/asyncapi.json")).toBe(true);

      const formatted = fs.readFileSync("dist/format/asyncapi.json", "utf-8");
      expect(() => JSON.parse(formatted) as unknown).not.toThrow();
    });

    it("should format AsyncAPI spec with references", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/spec-with-refs"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli([
        "asyncapi",
        "format",
        "asyncapi/asyncapi.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/format/asyncapi.json")).toBe(true);
    });
  });

  describe("default input handling", () => {
    it("should use default input path when no argument provided", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli(["asyncapi", "format", "--silent"]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/format/asyncapi.json")).toBe(true);
    });

    it("should fail when no input provided and default doesn't exist", () => {
      const result = runCli(["asyncapi", "format", "--silent"]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("no input document specified");
    });
  });

  describe("output options", () => {
    it("should work with custom output path", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli([
        "asyncapi",
        "format",
        "asyncapi/asyncapi.yaml",
        "--output",
        "custom/formatted.json",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("custom/formatted.json")).toBe(true);
      expect(fs.existsSync("dist/format/asyncapi.json")).toBe(false);
    });

    it("should format to JSON with --ext json", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli([
        "asyncapi",
        "format",
        "asyncapi/asyncapi.yaml",
        "--ext",
        "json",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/format/asyncapi.json")).toBe(true);

      const formatted = fs.readFileSync("dist/format/asyncapi.json", "utf-8");
      expect(() => JSON.parse(formatted) as unknown).not.toThrow();
    });

    it("should override output extension with --ext", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli([
        "asyncapi",
        "format",
        "asyncapi/asyncapi.yaml",
        "--output",
        "dist/formatted.yaml",
        "--ext",
        "json",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/formatted.json")).toBe(true);
      expect(fs.existsSync("dist/formatted.yaml")).toBe(false);
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
        "format",
        "custom/spec.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/format/asyncapi.json")).toBe(true);
    });

    it("should work with passthrough args", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli([
        "asyncapi",
        "format",
        "asyncapi/asyncapi.yaml",
        "--silent",
        "--",
        "--help",
      ]);

      // there's no other passthrough options for this command, so just checking it doesn't error out
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
        "format",
        "asyncapi/asyncapi.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(
        fs.existsSync(path.join(subDir, "dist/format/asyncapi.json")),
      ).toBe(true);
    });
  });
});
