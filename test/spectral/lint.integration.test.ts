import { exec, ExecException } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const execAsync = promisify(exec);

describe("Spectral Lint Integration Tests", () => {
  const originalCwd = process.cwd();
  let tempDir: string;
  const binPath = path.join(originalCwd, "dist/bin/api-tools.js");

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(process.cwd(), "test-temp-"));
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  async function runCli(args: string[]): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
  }> {
    try {
      const { stdout, stderr } = await execAsync(
        `node ${binPath} ${args.join(" ")}`,
      );
      return { stdout, stderr, exitCode: 0 };
    } catch (error) {
      if (isExecException(error)) {
        return {
          stdout: error.stdout ?? "",
          stderr: error.stderr ?? "",
          exitCode: error.code ?? 1,
        };
      }
      throw error;
    }
  }

  function isExecException(error: unknown): error is ExecException {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      "stdout" in error &&
      "stderr" in error
    );
  }

  describe("auto-detection", () => {
    it("should lint all found documents when no flags specified", async () => {
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

      const result = await runCli(["spectral", "lint", "--silent"]);
      expect(result.exitCode).toBe(0);
    });

    it("should succeed when only one document type exists", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = await runCli(["spectral", "lint", "--silent"]);
      expect(result.exitCode).toBe(0);
    });

    it("should fail when no documents found", async () => {
      const result = await runCli(["spectral", "lint", "--silent"]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("no input documents found");
    });

    it("should fail if any document fails", async () => {
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

      const result = await runCli(["spectral", "lint", "--silent"]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("type-specific flags", () => {
    it("should lint only OpenAPI when --openapi specified", async () => {
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

      const result = await runCli([
        "spectral",
        "lint",
        "--openapi",
        "--silent",
      ]);
      expect(result.exitCode).toBe(0);
    });

    it("should lint only AsyncAPI when --asyncapi specified", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = await runCli([
        "spectral",
        "lint",
        "--asyncapi",
        "--silent",
      ]);
      expect(result.exitCode).toBe(0);
    });

    it("should lint only Arazzo when --arazzo specified", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/arazzo/valid/simple-spec"),
        path.join(tempDir, "arazzo"),
        { recursive: true },
      );

      const result = await runCli(["spectral", "lint", "--arazzo", "--silent"]);
      expect(result.exitCode).toBe(0);
    });

    it("should lint multiple types when multiple flags specified", async () => {
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

      const result = await runCli([
        "spectral",
        "lint",
        "--openapi",
        "--asyncapi",
        "--silent",
      ]);
      expect(result.exitCode).toBe(0);
    });

    it("should fail when specified document type doesn't exist", async () => {
      // no documents created
      const result = await runCli([
        "spectral",
        "lint",
        "--openapi",
        "--silent",
      ]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("no input documents found");
    });
  });

  describe("explicit path overrides type flags", () => {
    it("should lint explicit path even when type flags present", async () => {
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

      const result = await runCli([
        "spectral",
        "lint",
        "custom/spec.yaml",
        "--openapi", // this should be ignored
        "--silent",
      ]);
      expect(result.exitCode).toBe(0);
    });

    it("should only lint explicit path, not auto-detected ones", async () => {
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
      const result = await runCli([
        "spectral",
        "lint",
        "custom/spec.yaml",
        "--silent",
      ]);
      expect(result.exitCode).toBe(0);
    });
  });

  describe("OpenAPI documents", () => {
    it("should pass for simple valid spec with bundled default config", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = await runCli([
        "spectral",
        "lint",
        "--openapi",
        "--silent",
      ]);
      expect(result.exitCode).toBe(0);
    });

    it("should pass for spec with references", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/spec-with-refs"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = await runCli([
        "spectral",
        "lint",
        "--openapi",
        "--silent",
      ]);
      expect(result.exitCode).toBe(0);
    });

    it("should pass when local .spectral.yaml exists", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      fs.cpSync(
        path.join(originalCwd, "defaults/spectral.yaml"),
        path.join(tempDir, ".spectral.yaml"),
      );

      const result = await runCli([
        "spectral",
        "lint",
        "--openapi",
        "--silent",
      ]);
      expect(result.exitCode).toBe(0);
    });

    it("should fail for invalid spec with bundled default config", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/invalid/broken-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = await runCli([
        "spectral",
        "lint",
        "--openapi",
        "--silent",
      ]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("AsyncAPI documents", () => {
    it("should pass for simple valid AsyncAPI spec", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = await runCli([
        "spectral",
        "lint",
        "--asyncapi",
        "--silent",
      ]);
      expect(result.exitCode).toBe(0);
    });

    it("should fail for invalid AsyncAPI spec", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/asyncapi/invalid/broken-spec"),
        path.join(tempDir, "asyncapi"),
        { recursive: true },
      );

      const result = await runCli([
        "spectral",
        "lint",
        "--asyncapi",
        "--silent",
      ]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("Arazzo documents", () => {
    it("should pass for simple valid Arazzo spec", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/arazzo/valid/simple-spec"),
        path.join(tempDir, "arazzo"),
        { recursive: true },
      );

      const result = await runCli(["spectral", "lint", "--arazzo", "--silent"]);
      expect(result.exitCode).toBe(0);
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
        "spectral",
        "lint",
        "custom/spec.yaml",
        "--silent",
      ]);
      expect(result.exitCode).toBe(0);
    });

    it("should work with custom ruleset path", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      fs.cpSync(
        path.join(originalCwd, "defaults/spectral.yaml"),
        path.join(tempDir, "custom-spectral.yaml"),
      );

      const result = await runCli([
        "spectral",
        "lint",
        "--openapi",
        "--ruleset",
        "custom-spectral.yaml",
        "--silent",
      ]);
      expect(result.exitCode).toBe(0);
    });

    it("should work with JSON output format", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = await runCli([
        "spectral",
        "lint",
        "--openapi",
        "--format",
        "json",
        "--output",
        "lint-results.json",
        "--silent",
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync(path.join(tempDir, "lint-results.json"))).toBe(true);

      const content = fs.readFileSync(
        path.join(tempDir, "lint-results.json"),
        "utf8",
      );
      expect(() => JSON.parse(content) as unknown).not.toThrow();
    });

    it("should work with custom fail severity", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = await runCli([
        "spectral",
        "lint",
        "--openapi",
        "--fail-severity",
        "error",
        "--silent",
      ]);
      expect(result.exitCode).toBe(0);
    });

    it("should work with display-only-failures flag", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = await runCli([
        "spectral",
        "lint",
        "--openapi",
        "--display-only-failures",
        "--silent",
      ]);
      expect(result.exitCode).toBe(0);
    });

    it("should work with verbose flag", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = await runCli([
        "spectral",
        "lint",
        "--openapi",
        "--verbose",
        "--silent",
      ]);
      expect(result.exitCode).toBe(0);
    });

    it("should work with passthrough args", async () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        { recursive: true },
      );

      const result = await runCli([
        "spectral",
        "lint",
        "--openapi",
        "--silent",
        "--",
        "--ignore-unknown-format",
      ]);
      expect(result.exitCode).toBe(0);
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
        "spectral",
        "lint",
        "--openapi",
        "--silent",
      ]);
      expect(result.exitCode).toBe(0);
    });
  });

  describe("raw spectral passthrough", () => {
    it("should pass unknown commands directly to spectral", async () => {
      const result = await runCli(["spectral", "--", "--help"]);
      expect(result.stdout).toContain("version");
      expect(result.stdout).toContain("help");
    });

    it("should show help when no args provided", async () => {
      const result = await runCli(["spectral"]);
      expect(result.stdout).toContain("Spectral-related commands");
    });
  });
});
