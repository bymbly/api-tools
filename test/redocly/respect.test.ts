import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { run } from "../../src/lib/redocly/cli.js";
import { Options, respect } from "../../src/lib/redocly/respect.js";
import { getSpawnCall, okSpawnResult, withDefaults } from "../helper.js";

vi.mock("node:child_process");

const createRun = withDefaults<Options>("arazzo/arazzo.yaml", {
  verbose: false,
});

describe("Redocly Respect Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(vi.fn());
    vi.spyOn(console, "error").mockImplementation(vi.fn());
    vi.spyOn(fs, "readdirSync").mockReturnValue([]);
    vi.mocked(spawnSync).mockReturnValue(okSpawnResult());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("run", () => {
    it("should pass args directly to redocly", () => {
      const exitCode = run(
        ["respect", "test.arazzo.yaml", "--verbose"],
        "inherit",
      );

      expect(exitCode).toBe(0);
      const call = getSpawnCall("inherit");
      expect(call.args).toEqual(
        expect.arrayContaining(["respect", "test.arazzo.yaml", "--verbose"]),
      );
    });

    it("should use ignore stdio when specified", () => {
      run(["--version"], "ignore");
      getSpawnCall("ignore");
    });

    it("should return non-zero exit code on failure", () => {
      vi.mocked(spawnSync).mockReturnValue({
        ...okSpawnResult(),
        status: 2,
      });

      const exitCode = run(["respect", "bad.arazzo.yaml"], "inherit");
      expect(exitCode).toBe(2);
    });
  });

  describe("respect", () => {
    it("should use provided input", () => {
      const run = createRun();

      expect(respect(run)).toBe(0);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("arazzo/arazzo.yaml");
    });

    it("should use custom input when provided", () => {
      const run = createRun({ input: "custom/workflows.arazzo.yaml" });

      respect(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("custom/workflows.arazzo.yaml");
    });

    it("should pass workflow option when provided", () => {
      const run = createRun({ options: { workflow: ["login", "checkout"] } });

      respect(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--workflow");
      expect(call.args).toContain("login");
      expect(call.args).toContain("checkout");
    });

    it("should pass skip option when provided", () => {
      const run = createRun({ options: { skip: ["slow-test", "flaky-test"] } });

      respect(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--skip");
      expect(call.args).toContain("slow-test");
      expect(call.args).toContain("flaky-test");
    });

    it("should pass verbose flag when true", () => {
      const run = createRun({ options: { verbose: true } });

      respect(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--verbose");
    });

    it("should not pass verbose flag when false", () => {
      const run = createRun({ options: { verbose: false } });

      respect(run);

      const call = getSpawnCall("inherit");
      expect(call.args).not.toContain("--verbose");
    });

    it("should pass input parameters when provided", () => {
      const run = createRun({
        options: { input: ["email=test@example.com", "password=secret"] },
      });

      respect(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--input");
      expect(call.args).toContain("email=test@example.com");
      expect(call.args).toContain("password=secret");
    });

    it("should pass server overrides when provided", () => {
      const run = createRun({
        options: { server: ["api=https://staging.example.com"] },
      });

      respect(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--server");
      expect(call.args).toContain("api=https://staging.example.com");
    });

    it("should pass json-output when provided", () => {
      const run = createRun({ options: { jsonOutput: "results.json" } });

      respect(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--json-output");
      expect(call.args).toContain("results.json");
    });

    it("should pass har-output when provided", () => {
      const run = createRun({ options: { harOutput: "requests.har" } });

      respect(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--har-output");
      expect(call.args).toContain("requests.har");
    });

    it("should use ignore stdio when globals.silent is true", () => {
      const run = createRun({ globals: { quiet: false, silent: true } });

      respect(run);
      getSpawnCall("ignore");
    });

    it("should suppress wrapper logging when quiet", () => {
      const logSpy = vi.spyOn(console, "log");

      const run = createRun({ globals: { quiet: true, silent: false } });

      respect(run);

      expect(logSpy).not.toHaveBeenCalled();
    });

    it("should show wrapper logging when not quiet", () => {
      const logSpy = vi.spyOn(console, "log");

      const run = createRun({ globals: { quiet: false, silent: false } });

      respect(run);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("Redocly respect"),
      );
    });

    it("should log workflows when provided", () => {
      const logSpy = vi.spyOn(console, "log");

      const run = createRun({
        globals: { quiet: false, silent: false },
        options: { workflow: ["login", "checkout"] },
      });

      respect(run);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("Workflows: login, checkout"),
      );
    });

    it("should log skipped workflows when provided", () => {
      const logSpy = vi.spyOn(console, "log");

      const run = createRun({
        globals: { quiet: false, silent: false },
        options: { skip: ["slow-test"] },
      });

      respect(run);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("Skipped Workflows: slow-test"),
      );
    });

    it("should log server overrides when provided", () => {
      const logSpy = vi.spyOn(console, "log");

      const run = createRun({
        globals: { quiet: false, silent: false },
        options: { server: ["api=https://staging.example.com"] },
      });

      respect(run);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "Server Overrides: api=https://staging.example.com",
        ),
      );
    });

    it("should forward passthrough args to redocly", () => {
      const run = createRun({
        passthrough: ["--max-steps", "100"],
      });

      respect(run);

      const call = getSpawnCall("inherit");
      expect(call.args).toContain("--max-steps");
      expect(call.args).toContain("100");
    });

    it("should return non-zero exit code on execution failure", () => {
      vi.mocked(spawnSync).mockReturnValue({
        ...okSpawnResult(),
        status: 1,
      });

      const run = createRun();

      expect(respect(run)).toBe(1);
    });

    it("should throw when spawnSync errors", () => {
      vi.mocked(spawnSync).mockReturnValue({
        ...okSpawnResult(),
        error: new Error("spawn failed"),
      });

      const run = createRun();

      expect(() => respect(run)).toThrow("spawn failed");
    });
  });
});
