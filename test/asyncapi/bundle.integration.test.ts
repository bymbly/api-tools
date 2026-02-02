import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCli } from "../helper.js";

describe("AsyncAPI Bundle Integration Tests", () => {
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
    it("should bundle simple spec", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli([
        "asyncapi",
        "bundle",
        "asyncapi/asyncapi.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/bundle/asyncapi.yaml")).toBe(true);

      const bundled = fs.readFileSync("dist/bundle/asyncapi.yaml", "utf-8");
      expect(bundled).toContain("asyncapi:");
      expect(bundled).toContain("Simple AsyncAPI");
    });

    it("should bundle spec with references", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/spec-with-refs"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli([
        "asyncapi",
        "bundle",
        "asyncapi/asyncapi.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/bundle/asyncapi.yaml")).toBe(true);

      const bundled = fs.readFileSync("dist/bundle/asyncapi.yaml", "utf-8");
      expect(bundled).toContain("asyncapi:");
      expect(bundled).toContain("payload");
    });
  });

  describe("default input handling", () => {
    it("should use default input path when no argument provided", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli(["asyncapi", "bundle", "--silent"]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/bundle/asyncapi.yaml")).toBe(true);
    });

    it("should fail when no input provided and default doesn't exist", () => {
      const result = runCli(["asyncapi", "bundle", "--silent"]);

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
        "bundle",
        "asyncapi/asyncapi.yaml",
        "--output",
        "custom/bundle.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("custom/bundle.yaml")).toBe(true);
      expect(fs.existsSync("dist/bundle/asyncapi.yaml")).toBe(false);
    });

    it("should bundle to JSON with --ext json", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli([
        "asyncapi",
        "bundle",
        "asyncapi/asyncapi.yaml",
        "--ext",
        "json",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/bundle/asyncapi.json")).toBe(true);

      const bundled = fs.readFileSync("dist/bundle/asyncapi.json", "utf-8");
      expect(() => JSON.parse(bundled) as unknown).not.toThrow();
    });

    it("should override output extension with --ext", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli([
        "asyncapi",
        "bundle",
        "asyncapi/asyncapi.yaml",
        "--output",
        "dist/bundle.yaml",
        "--ext",
        "json",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/bundle.json")).toBe(true);
      expect(fs.existsSync("dist/bundle.yaml")).toBe(false);
    });
  });

  describe("xOrigin option", () => {
    it("should include x-origin properties when flag is set", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/spec-with-refs"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli([
        "asyncapi",
        "bundle",
        "asyncapi/asyncapi.yaml",
        "--xOrigin",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/bundle/asyncapi.yaml")).toBe(true);

      const bundled = fs.readFileSync("dist/bundle/asyncapi.yaml", "utf-8");
      // x-origin should be present when bundling with refs
      expect(bundled).toContain("x-origin");
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
        "bundle",
        "custom/spec.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/bundle/asyncapi.yaml")).toBe(true);
    });

    it("should work with passthrough args", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/spec-with-refs"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli([
        "asyncapi",
        "bundle",
        "asyncapi/asyncapi.yaml",
        "--silent",
        "--",
        "--baseDir",
        ".",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/bundle/asyncapi.yaml")).toBe(true);
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
        "bundle",
        "asyncapi/asyncapi.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(
        fs.existsSync(path.join(subDir, "dist/bundle/asyncapi.yaml")),
      ).toBe(true);
    });
  });
});
