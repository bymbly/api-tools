import fs from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { respect } from "../../src/lib/redocly/respect";

/**
 * Integration tests for Redocly Arazzo Respect command require a live API server.
 * These tests cover scenarios where Arazzo workflows are expected to fail.
 */

describe("Respect Integration Tests", () => {
  const originalEnv = process.env;
  const originalCwd = process.cwd();
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(process.cwd(), "test-temp-"));
    process.chdir(tempDir);
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.chdir(originalCwd);
    process.env = originalEnv;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe("invalid workflows", () => {
    it("should fail for nonexistent file", () => {
      process.env.ARAZZO_INPUT = "arazzo/nonexistent.arazzo.yaml";

      const mockExit = vi
        .spyOn(process, "exit")
        .mockImplementation(() => undefined as never);

      respect();

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });

    it("should fail for invalid workflow file", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/arazzo/invalid"),
        path.join(tempDir, "arazzo"),
        {
          recursive: true,
        },
      );

      const mockExit = vi
        .spyOn(process, "exit")
        .mockImplementation(() => undefined as never);

      respect();

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });
  });
});
