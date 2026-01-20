import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCli } from "../helper.js";

describe("Redocly Build-Docs Integration Tests", () => {
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
    it("should build docs for simple valid spec with bundled default config", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = await runCli([
        "redocly",
        "build-docs",
        "openapi/openapi.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/docs/openapi.html")).toBe(true);

      const html = fs.readFileSync("dist/docs/openapi.html", "utf-8");
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("Simple Test API");
    });

    it("should build docs for spec with references", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/spec-with-refs"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = await runCli([
        "redocly",
        "build-docs",
        "openapi/openapi.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/docs/openapi.html")).toBe(true);

      const html = fs.readFileSync("dist/docs/openapi.html", "utf-8");
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("Test API with References");
      expect(html).toContain("TestSchema");
    });

    it("should build docs when local redocly.yaml exists", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      fs.cpSync(
        path.join(originalCwd, "defaults/redocly.yaml"),
        path.join(tempDir, "redocly.yaml"),
      );

      const result = await runCli([
        "redocly",
        "build-docs",
        "openapi/openapi.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/docs/openapi.html")).toBe(true);
    });

    it("should succeed even for invalid spec (build-docs doesn't validate)", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/invalid/broken-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = await runCli([
        "redocly",
        "build-docs",
        "openapi/openapi.yaml",
        "--silent",
      ]);

      // build-docs is permissive - it builds docs even for invalid specs
      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/docs/openapi.html")).toBe(true);
    });
  });

  describe("default input handling", () => {
    it("should use default input path when no argument provided", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = await runCli(["redocly", "build-docs", "--silent"]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/docs/openapi.html")).toBe(true);
    });

    it("should fail when no input provided and default doesn't exist", async () => {
      const result = await runCli(["redocly", "build-docs", "--silent"]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("no input document specified");
    });
  });

  describe("custom options", () => {
    it("should work with custom input path", async () => {
      fs.mkdirSync(path.join(tempDir, "custom"), { recursive: true });
      fs.copyFileSync(
        path.join(
          originalCwd,
          "test/fixtures/openapi/valid/simple-spec/openapi.yaml",
        ),
        path.join(tempDir, "custom/spec.yaml"),
      );

      const result = await runCli([
        "redocly",
        "build-docs",
        "custom/spec.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/docs/openapi.html")).toBe(true);
    });

    it("should work with custom output path", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = await runCli([
        "redocly",
        "build-docs",
        "openapi/openapi.yaml",
        "--output",
        "custom-dist/docs.html",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("custom-dist/docs.html")).toBe(true);
      expect(fs.existsSync("dist/docs/openapi.html")).toBe(false);
    });

    it("should work with custom config path", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      fs.cpSync(
        path.join(originalCwd, "defaults/redocly.yaml"),
        path.join(tempDir, "custom-redocly.yaml"),
      );

      const result = await runCli([
        "redocly",
        "build-docs",
        "openapi/openapi.yaml",
        "--config",
        "custom-redocly.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/docs/openapi.html")).toBe(true);
    });

    it("should work with passthrough args", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = await runCli([
        "redocly",
        "build-docs",
        "openapi/openapi.yaml",
        "--silent",
        "--",
        "--title",
        '"Custom API Documentation"',
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/docs/openapi.html")).toBe(true);

      const html = fs.readFileSync("dist/docs/openapi.html", "utf-8");
      expect(html).toContain("Custom API Documentation");
    });

    it("should respect --cwd flag", async () => {
      const subDir = path.join(tempDir, "subdir");
      fs.mkdirSync(subDir, { recursive: true });

      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(subDir, "openapi"),
        { recursive: true },
      );

      const result = await runCli([
        "--cwd",
        subDir,
        "redocly",
        "build-docs",
        "openapi/openapi.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync(path.join(subDir, "dist/docs/openapi.html"))).toBe(
        true,
      );
    });
  });
});
