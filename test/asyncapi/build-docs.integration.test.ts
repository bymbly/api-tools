import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runCli } from "../helper.js";

describe("AsyncAPI Build-Docs Integration Tests", () => {
  let tempDir: string;
  let originalCwd: string;

  beforeAll(() => {
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(originalCwd, "test-temp-"));
    process.chdir(tempDir);
  });

  afterAll(() => {
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should work as top-level command alias", () => {
    fs.cpSync(
      path.join(originalCwd, "test/fixtures/asyncapi/valid/simple-spec"),
      path.join(tempDir, "asyncapi"),
      { recursive: true },
    );

    const result = runCli(["asyncapi", "build-docs", "--silent"]);

    expect(result.exitCode).toBe(0);
    expect(fs.existsSync("dist/docs/asyncapi.html")).toBe(true);
  });
});
