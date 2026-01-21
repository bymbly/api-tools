import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCli } from "../helper.js";

describe("Redocly Bundle Integration Tests", () => {
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
    it("should bundle simple spec with bundled default config", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = await runCli([
        "redocly",
        "bundle",
        "openapi/openapi.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/bundle/openapi.yaml")).toBe(true);

      const bundled = fs.readFileSync("dist/bundle/openapi.yaml", "utf-8");
      expect(bundled).toContain("openapi:");
      expect(bundled).toContain("Simple Test API");
    });

    it("should bundle spec with references", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/spec-with-refs"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = await runCli([
        "redocly",
        "bundle",
        "openapi/openapi.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/bundle/openapi.yaml")).toBe(true);

      const bundled = fs.readFileSync("dist/bundle/openapi.yaml", "utf-8");
      expect(bundled).toContain("openapi:");
      expect(bundled).toContain("Test API with References");
      expect(bundled).toContain("TestSchema");
    });

    it("should bundle when local redocly.yaml exists", async () => {
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
        "bundle",
        "openapi/openapi.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/bundle/openapi.yaml")).toBe(true);
    });

    it("should succeed even for invalid spec (bundle doesn't validate)", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/invalid/broken-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = await runCli([
        "redocly",
        "bundle",
        "openapi/openapi.yaml",
        "--silent",
      ]);

      // bundle is permissive - it bundles even for invalid specs
      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/bundle/openapi.yaml")).toBe(true);
    });
  });

  describe("default input handling", () => {
    it("should use default input path when no argument provided", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = await runCli(["redocly", "bundle", "--silent"]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/bundle/openapi.yaml")).toBe(true);
    });

    it("should fail when no input provided and default doesn't exist", async () => {
      const result = await runCli(["redocly", "bundle", "--silent"]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("no input document specified");
    });
  });

  describe("output options", () => {
    it("should work with custom output path", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = await runCli([
        "redocly",
        "bundle",
        "openapi/openapi.yaml",
        "--output",
        "custom/bundle.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("custom/bundle.yaml")).toBe(true);
      expect(fs.existsSync("dist/bundle/openapi.yaml")).toBe(false);
    });

    it("should bundle to JSON with --ext json", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = await runCli([
        "redocly",
        "bundle",
        "openapi/openapi.yaml",
        "--ext",
        "json",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/bundle/openapi.json")).toBe(true);

      const bundled = fs.readFileSync("dist/bundle/openapi.json", "utf-8");
      const parsed = JSON.parse(bundled);
      expect(parsed.openapi).toBe("3.1.1");
      expect(parsed.info.title).toBe("Simple Test API");
    });

    it("should override output extension with --ext", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = await runCli([
        "redocly",
        "bundle",
        "openapi/openapi.yaml",
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

  describe("dereferenced bundles", () => {
    it("should create fully dereferenced bundle", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/spec-with-refs"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = await runCli([
        "redocly",
        "bundle",
        "openapi/openapi.yaml",
        "--dereferenced",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/bundle/openapi.yaml")).toBe(true);

      const bundled = fs.readFileSync("dist/bundle/openapi.yaml", "utf-8");
      // dereferenced bundles should not contain $ref
      expect(bundled).not.toContain("$ref:");
      expect(bundled).toContain("TestSchema");
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
        "bundle",
        "custom/spec.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/bundle/openapi.yaml")).toBe(true);
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
        "bundle",
        "openapi/openapi.yaml",
        "--config",
        "custom-redocly.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/bundle/openapi.yaml")).toBe(true);
    });

    it("should work with passthrough args", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/spec-with-refs"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = await runCli([
        "redocly",
        "bundle",
        "openapi/openapi.yaml",
        "--silent",
        "--",
        "--remove-unused-components",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/bundle/openapi.yaml")).toBe(true);
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
        "bundle",
        "openapi/openapi.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync(path.join(subDir, "dist/bundle/openapi.yaml"))).toBe(
        true,
      );
    });
  });
});
