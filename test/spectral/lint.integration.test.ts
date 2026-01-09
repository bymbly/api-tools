import { exec } from "node:child_process";
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
    } catch (error: any) {
      return {
        stdout: error.stdout || "",
        stderr: error.stderr || "",
        exitCode: error.code || 1,
      };
    }
  }

  describe("OpenAPI specs", () => {
    describe("valid specs", () => {
      it("should pass for simple valid spec with bundled default config", async () => {
        fs.cpSync(
          path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
          path.join(tempDir, "openapi"),
          { recursive: true },
        );

        const result = await runCli(["spectral", "lint", "--silent"]);
        expect(result.exitCode).toBe(0);
      });

      it("should pass for spec with references", async () => {
        fs.cpSync(
          path.join(originalCwd, "test/fixtures/openapi/valid/spec-with-refs"),
          path.join(tempDir, "openapi"),
          { recursive: true },
        );

        const result = await runCli(["spectral", "lint", "--silent"]);
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

        const result = await runCli(["spectral", "lint", "--silent"]);
        expect(result.exitCode).toBe(0);
      });
    });

    describe("invalid specs", () => {
      it("should fail for invalid spec with bundled default config", async () => {
        fs.cpSync(
          path.join(originalCwd, "test/fixtures/openapi/invalid/broken-spec"),
          path.join(tempDir, "openapi"),
          { recursive: true },
        );

        const result = await runCli(["spectral", "lint", "--silent"]);
        expect(result.exitCode).not.toBe(0);
      });
    });
  });

  describe("AsyncAPI specs", () => {
    describe("valid specs", () => {
      it("should pass for simple valid AsyncAPI spec", async () => {
        fs.cpSync(
          path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
          path.join(tempDir, "asyncapi"),
          { recursive: true },
        );

        const result = await runCli([
          "spectral",
          "lint",
          "asyncapi/asyncapi.yaml",
          "--silent",
        ]);
        expect(result.exitCode).toBe(0);
      });
    });

    describe("invalid specs", () => {
      it("should fail for invalid AsyncAPI spec", async () => {
        fs.cpSync(
          path.join(originalCwd, "test/fixtures/asyncapi/invalid/broken-spec"),
          path.join(tempDir, "asyncapi"),
          { recursive: true },
        );

        const result = await runCli([
          "spectral",
          "lint",
          "asyncapi/asyncapi.yaml",
          "--silent",
        ]);
        expect(result.exitCode).not.toBe(0);
      });
    });
  });

  describe("Arazzo specs", () => {
    describe("valid specs", () => {
      it("should pass for simple valid Arazzo spec", async () => {
        fs.cpSync(
          path.join(originalCwd, "test/fixtures/arazzo/valid/simple-spec"),
          path.join(tempDir, "arazzo"),
          { recursive: true },
        );

        const result = await runCli([
          "spectral",
          "lint",
          "arazzo/arazzo.yaml",
          "--silent",
        ]);
        expect(result.exitCode).toBe(0);
      });
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
      expect(() => JSON.parse(content)).not.toThrow();
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
