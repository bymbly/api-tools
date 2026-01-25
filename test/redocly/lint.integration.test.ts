import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCli } from "../helper.js";

describe("Redocly Lint Integration Tests", () => {
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

  describe("auto-detection", () => {
    it("should lint all found documents when no flags specified", () => {
      // create all three types
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      fs.cpSync(
        path.join(originalCwd, "test/fixtures/arazzo/valid/simple-spec"),
        path.join(tempDir, "arazzo"),
        { recursive: true },
      );

      const result = runCli(["redocly", "lint", "--silent"]);
      expect(result.exitCode).toBe(0);
    });

    it("should succeed when only one document type exists", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = runCli(["redocly", "lint", "--silent"]);
      expect(result.exitCode).toBe(0);
    });

    it("should fail when no documents found", () => {
      const result = runCli(["redocly", "lint", "--silent"]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("no input documents found");
    });

    it("should fail if any document fails", () => {
      // valid OpenAPI
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      // invalid AsyncAPI
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/invalid/broken-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli(["redocly", "lint", "--silent"]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("type-specific flags", () => {
    it("should lint only OpenAPI when --openapi specified", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      // also create AsyncAPI, but it shouldn't be linted
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli(["redocly", "lint", "--openapi", "--silent"]);
      expect(result.exitCode).toBe(0);
    });

    it("should lint only AsyncAPI when --asyncapi specified", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli(["redocly", "lint", "--asyncapi", "--silent"]);
      expect(result.exitCode).toBe(0);
    });

    it("should lint only Arazzo when --arazzo specified", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/arazzo/valid/simple-spec"),
        path.join(tempDir, "arazzo"),
        { recursive: true },
      );

      const result = runCli(["redocly", "lint", "--arazzo", "--silent"]);
      expect(result.exitCode).toBe(0);
    });

    it("should lint multiple types when multiple flags specified", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli([
        "redocly",
        "lint",
        "--openapi",
        "--asyncapi",
        "--silent",
      ]);
      expect(result.exitCode).toBe(0);
    });

    it("should fail when specified document type doesn't exist", () => {
      // no documents created
      const result = runCli(["redocly", "lint", "--openapi", "--silent"]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("no input documents found");
    });
  });

  describe("explicit path overrides type flags", () => {
    it("should lint explicit path even when type flags present", () => {
      fs.mkdirSync(path.join(tempDir, "custom"), { recursive: true });
      fs.copyFileSync(
        path.join(
          originalCwd,
          "test/fixtures/openapi/valid/simple-spec/openapi.yaml",
        ),
        path.join(tempDir, "custom/spec.yaml"),
      );

      // create openapi default location too
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = runCli([
        "redocly",
        "lint",
        "custom/spec.yaml",
        "--openapi", // this should be ignored
        "--silent",
      ]);
      expect(result.exitCode).toBe(0);
    });

    it("should only lint explicit path, not auto-detected ones", () => {
      fs.mkdirSync(path.join(tempDir, "custom"), { recursive: true });
      fs.copyFileSync(
        path.join(
          originalCwd,
          "test/fixtures/openapi/valid/simple-spec/openapi.yaml",
        ),
        path.join(tempDir, "custom/spec.yaml"),
      );

      // create invalid openapi at default location
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/invalid/broken-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      // should pass because it only lints custom/spec.yaml
      const result = runCli([
        "redocly",
        "lint",
        "custom/spec.yaml",
        "--silent",
      ]);
      expect(result.exitCode).toBe(0);
    });
  });

  describe("OpenAPI documents", () => {
    it("should pass for simple valid spec with bundled default config", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = runCli(["redocly", "lint", "--openapi", "--silent"]);
      expect(result.exitCode).toBe(0);
    });

    it("should pass for spec with references", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/spec-with-refs"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = runCli(["redocly", "lint", "--openapi", "--silent"]);
      expect(result.exitCode).toBe(0);
    });

    it("should pass when local redocly.yaml exists", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      fs.cpSync(
        path.join(originalCwd, "defaults/redocly.yaml"),
        path.join(tempDir, "redocly.yaml"),
      );

      const result = runCli(["redocly", "lint", "--openapi", "--silent"]);
      expect(result.exitCode).toBe(0);
    });

    it("should fail for invalid spec with bundled default config", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/invalid/broken-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = runCli(["redocly", "lint", "--openapi", "--silent"]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("AsyncAPI documents", () => {
    it("should pass for simple valid AsyncAPI spec", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli(["redocly", "lint", "--asyncapi", "--silent"]);
      expect(result.exitCode).toBe(0);
    });

    it("should fail for invalid AsyncAPI spec", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/invalid/broken-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = runCli(["redocly", "lint", "--asyncapi", "--silent"]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("Arazzo documents", () => {
    it("should pass for simple valid Arazzo spec", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/arazzo/valid/simple-spec"),
        path.join(tempDir, "arazzo"),
        { recursive: true },
      );

      const result = runCli(["redocly", "lint", "--arazzo", "--silent"]);
      expect(result.exitCode).toBe(0);
    });

    it("should fail for invalid Arazzo spec", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/arazzo/invalid/broken-spec"),
        path.join(tempDir, "arazzo"),
        { recursive: true },
      );

      const result = runCli(["redocly", "lint", "--arazzo", "--silent"]);
      expect(result.exitCode).not.toBe(0);
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
        "lint",
        "custom/spec.yaml",
        "--silent",
      ]);
      expect(result.exitCode).toBe(0);
    });

    it("should work with custom config path", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      fs.cpSync(
        path.join(originalCwd, "defaults/redocly.yaml"),
        path.join(tempDir, "custom-redocly.yaml"),
      );

      const result = runCli([
        "redocly",
        "lint",
        "--openapi",
        "--config",
        "custom-redocly.yaml",
        "--silent",
      ]);
      expect(result.exitCode).toBe(0);
    });

    it("should work with JSON output format", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = runCli([
        "redocly",
        "lint",
        "--openapi",
        "--format",
        "json",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
    });

    it("should work with passthrough args", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = runCli([
        "redocly",
        "lint",
        "--openapi",
        "--silent",
        "--",
        "--version",
      ]);
      expect(result.exitCode).toBe(0);
    });

    it("should block --generate-ignore-file with bundled config", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = runCli([
        "redocly",
        "lint",
        "--openapi",
        "--silent",
        "--",
        "--generate-ignore-file",
      ]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain(
        "Cannot use --generate-ignore-file with bundled config",
      );
    });

    it("should create config file with init command", () => {
      const result = runCli(["redocly", "init"]);
      expect(result.exitCode).toBe(0);
      expect(fs.existsSync(path.join(tempDir, "redocly.yaml"))).toBe(true);
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
        "lint",
        "--openapi",
        "--silent",
      ]);
      expect(result.exitCode).toBe(0);
    });
  });

  describe("raw redocly passthrough", () => {
    it("should pass unknown commands directly to redocly", () => {
      const result = runCli(["redocly", "--", "--help"]);
      expect(result.stdout).toContain("version");
      expect(result.stdout).toContain("help");
    });

    it("should show help when no args provided", () => {
      const result = runCli(["redocly"]);
      expect(result.stdout).toContain("Redocly-related commands");
    });
  });
});
