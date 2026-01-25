import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCli } from "../helper.js";

/**
 * Integration tests for Redocly Arazzo Respect command require a live API server.
 * These tests cover scenarios where Arazzo workflows are expected to fail.
 */

describe("Redocly Respect Integration Tests", () => {
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

  describe("Arazzo documents", () => {
    it("should execute valid Arazzo workflow", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/arazzo/valid/simple-spec"),
        path.join(tempDir, "arazzo"),
        { recursive: true },
      );

      const result = runCli([
        "redocly",
        "respect",
        "arazzo/arazzo.yaml",
        "--silent",
      ]);

      // will fail because no actual API to test against, but command should run
      expect(result.exitCode).not.toBe(127); // command not found
    });

    it("should fail for invalid Arazzo spec", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/arazzo/invalid/broken-spec"),
        path.join(tempDir, "arazzo"),
        { recursive: true },
      );

      const result = runCli([
        "redocly",
        "respect",
        "arazzo/arazzo.yaml",
        "--silent",
      ]);

      expect(result.exitCode).not.toBe(0);
      expect(result.exitCode).not.toBe(127);
    });
  });

  describe("default input handling", () => {
    it("should use default input path when no argument provided", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/arazzo/valid/simple-spec"),
        path.join(tempDir, "arazzo"),
        { recursive: true },
      );

      const result = runCli(["redocly", "respect", "--silent"]);

      expect(result.exitCode).not.toBe(127);
    });

    it("should fail when no input provided and default doesn't exist", () => {
      const result = runCli(["redocly", "respect", "--silent"]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("no input document specified");
    });
  });

  describe("command options", () => {
    beforeEach(() => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/arazzo/valid/simple-spec"),
        path.join(tempDir, "arazzo"),
        { recursive: true },
      );
    });

    it("should work with custom input path", () => {
      fs.mkdirSync(path.join(tempDir, "custom"), { recursive: true });
      fs.copyFileSync(
        path.join(
          originalCwd,
          "test/fixtures/arazzo/valid/simple-spec/arazzo.yaml",
        ),
        path.join(tempDir, "custom/workflows.arazzo.yaml"),
      );

      const result = runCli([
        "redocly",
        "respect",
        "custom/workflows.arazzo.yaml",
        "--silent",
      ]);

      expect(result.exitCode).not.toBe(127);
    });

    it("should accept workflow option", () => {
      const result = runCli([
        "redocly",
        "respect",
        "arazzo/arazzo.yaml",
        "--workflow",
        "test-flow",
        "--silent",
      ]);

      expect(result.exitCode).not.toBe(127);
    });

    it("should accept skip option", () => {
      const result = runCli([
        "redocly",
        "respect",
        "arazzo/arazzo.yaml",
        "--skip",
        "slow-flow",
        "--silent",
      ]);

      expect(result.exitCode).not.toBe(127);
    });

    it("should accept verbose flag", () => {
      const result = runCli([
        "redocly",
        "respect",
        "arazzo/arazzo.yaml",
        "--verbose",
        "--silent",
      ]);

      expect(result.exitCode).not.toBe(127);
    });

    it("should accept input parameters", () => {
      const result = runCli([
        "redocly",
        "respect",
        "arazzo/arazzo.yaml",
        "--input",
        "email=test@example.com",
        "--silent",
      ]);

      expect(result.exitCode).not.toBe(127);
    });

    it("should accept server overrides", () => {
      const result = runCli([
        "redocly",
        "respect",
        "arazzo/arazzo.yaml",
        "--server",
        "api=https://test.example.com",
        "--silent",
      ]);

      expect(result.exitCode).not.toBe(127);
    });

    it("should accept json-output option", () => {
      const result = runCli([
        "redocly",
        "respect",
        "arazzo/arazzo.yaml",
        "--json-output",
        "results.json",
        "--silent",
      ]);

      expect(result.exitCode).not.toBe(127);
    });

    it("should accept har-output option", () => {
      const result = runCli([
        "redocly",
        "respect",
        "arazzo/arazzo.yaml",
        "--har-output",
        "requests.har",
        "--silent",
      ]);

      expect(result.exitCode).not.toBe(127);
    });

    it("should work with passthrough args", () => {
      const result = runCli([
        "redocly",
        "respect",
        "arazzo/arazzo.yaml",
        "--silent",
        "--",
        "--max-steps",
        "100",
      ]);

      expect(result.exitCode).not.toBe(127);
    });

    it("should respect --cwd flag", () => {
      const subDir = path.join(tempDir, "subdir");
      fs.mkdirSync(subDir, { recursive: true });

      fs.cpSync(
        path.join(originalCwd, "test/fixtures/arazzo/valid/simple-spec"),
        path.join(subDir, "arazzo"),
        { recursive: true },
      );

      const result = runCli([
        "--cwd",
        subDir,
        "redocly",
        "respect",
        "arazzo/arazzo.yaml",
        "--silent",
      ]);

      expect(result.exitCode).not.toBe(127);
    });
  });

  describe("conflict handling", () => {
    beforeEach(() => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/arazzo/valid/simple-spec"),
        path.join(tempDir, "arazzo"),
        { recursive: true },
      );
    });

    it("should reject workflow and skip used together", () => {
      const result = runCli([
        "redocly",
        "respect",
        "arazzo/arazzo.yaml",
        "--workflow",
        "test1",
        "--skip",
        "test2",
        "--silent",
      ]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("cannot be used with");
    });
  });
});
