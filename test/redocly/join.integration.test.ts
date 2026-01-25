import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCli } from "../helper.js";

describe("Redocly Join Integration Tests", () => {
  const originalEnv = process.env;
  const originalCwd = process.cwd();
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(process.cwd(), "test-temp-"));
    process.chdir(tempDir);
    // prevent redocly `join` tests from behaving differently in test env
    // note: as-of now, only the `join` command is affected by NODE_ENV
    // https://github.com/Redocly/redocly-cli/blob/main/packages/cli/src/utils/miscellaneous.ts#L254
    process.env = { ...originalEnv, NODE_ENV: "production" };
  });

  afterEach(() => {
    process.env = originalEnv;
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe("OpenAPI documents", () => {
    it("should join two valid OpenAPI documents", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "api1"),
        { recursive: true },
      );

      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/spec-with-refs"),
        path.join(tempDir, "api2"),
        { recursive: true },
      );

      const result = runCli([
        "redocly",
        "join",
        "api1/openapi.yaml",
        "api2/openapi.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/join/openapi.yaml")).toBe(true);

      const joined = fs.readFileSync("dist/join/openapi.yaml", "utf-8");
      expect(joined).toContain("openapi:");
    });

    it("should join when local redocly.yaml exists", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "api1"),
        { recursive: true },
      );

      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/spec-with-refs"),
        path.join(tempDir, "api2"),
        { recursive: true },
      );

      fs.cpSync(
        path.join(originalCwd, "defaults/redocly.yaml"),
        path.join(tempDir, "redocly.yaml"),
      );

      const result = runCli([
        "redocly",
        "join",
        "api1/openapi.yaml",
        "api2/openapi.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/join/openapi.yaml")).toBe(true);
    });
  });

  describe("validation", () => {
    it("should fail when less than 2 inputs provided", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = runCli([
        "redocly",
        "join",
        "openapi/openapi.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("requires at least 2 input documents");
    });

    it("should fail when joining more than 2 inputs with conflicts", () => {
      // create multiple copies of the same spec to induce conflicts
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "api1"),
        { recursive: true },
      );

      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "api2"),
        { recursive: true },
      );

      const result = runCli([
        "redocly",
        "join",
        "api1/openapi.yaml",
        "api2/openapi.yaml",
        "--silent",
      ]);

      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("prefix options", () => {
    it("should work with prefix-components-with-info-prop", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "api1"),
        { recursive: true },
      );

      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/spec-with-refs"),
        path.join(tempDir, "api2"),
        { recursive: true },
      );

      const result = runCli([
        "redocly",
        "join",
        "api1/openapi.yaml",
        "api2/openapi.yaml",
        "--prefix-components-with-info-prop",
        "title",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/join/openapi.yaml")).toBe(true);
    });

    it("should work with prefix-tags-with-filename", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "api1"),
        { recursive: true },
      );

      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/spec-with-refs"),
        path.join(tempDir, "api2"),
        { recursive: true },
      );

      const result = runCli([
        "redocly",
        "join",
        "api1/openapi.yaml",
        "api2/openapi.yaml",
        "--prefix-tags-with-filename",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/join/openapi.yaml")).toBe(true);
    });

    it("should work with without-x-tag-groups", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "api1"),
        { recursive: true },
      );

      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/spec-with-refs"),
        path.join(tempDir, "api2"),
        { recursive: true },
      );

      const result = runCli([
        "redocly",
        "join",
        "api1/openapi.yaml",
        "api2/openapi.yaml",
        "--without-x-tag-groups",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/join/openapi.yaml")).toBe(true);
    });
  });

  describe("custom options", () => {
    it("should work with custom output path", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "api1"),
        { recursive: true },
      );

      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/spec-with-refs"),
        path.join(tempDir, "api2"),
        { recursive: true },
      );

      const result = runCli([
        "redocly",
        "join",
        "api1/openapi.yaml",
        "api2/openapi.yaml",
        "--output",
        "custom/api.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("custom/api.yaml")).toBe(true);
    });

    it("should work with custom config path", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "api1"),
        { recursive: true },
      );

      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/spec-with-refs"),
        path.join(tempDir, "api2"),
        { recursive: true },
      );

      fs.cpSync(
        path.join(originalCwd, "defaults/redocly.yaml"),
        path.join(tempDir, "custom-redocly.yaml"),
      );

      const result = runCli([
        "redocly",
        "join",
        "api1/openapi.yaml",
        "api2/openapi.yaml",
        "--config",
        "custom-redocly.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/join/openapi.yaml")).toBe(true);
    });

    it("should work with passthrough args", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "api1"),
        { recursive: true },
      );

      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/spec-with-refs"),
        path.join(tempDir, "api2"),
        { recursive: true },
      );

      const result = runCli([
        "redocly",
        "join",
        "api1/openapi.yaml",
        "api2/openapi.yaml",
        "--silent",
        "--",
        "--lint-config",
        "error",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync("dist/join/openapi.yaml")).toBe(true);
    });

    it("should respect --cwd flag", () => {
      const subDir = path.join(tempDir, "subdir");
      fs.mkdirSync(subDir, { recursive: true });

      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(subDir, "api1"),
        { recursive: true },
      );

      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/spec-with-refs"),
        path.join(subDir, "api2"),
        { recursive: true },
      );

      const result = runCli([
        "--cwd",
        subDir,
        "redocly",
        "join",
        "api1/openapi.yaml",
        "api2/openapi.yaml",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync(path.join(subDir, "dist/join/openapi.yaml"))).toBe(
        true,
      );
    });
  });

  describe("conflict handling", () => {
    it("should reject conflicting prefix options", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "api1"),
        { recursive: true },
      );

      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/spec-with-refs"),
        path.join(tempDir, "api2"),
        { recursive: true },
      );

      const result = runCli([
        "redocly",
        "join",
        "api1/openapi.yaml",
        "api2/openapi.yaml",
        "--prefix-tags-with-filename",
        "--without-x-tag-groups",
        "--silent",
      ]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("cannot be used with");
    });
  });
});
