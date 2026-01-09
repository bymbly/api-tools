import { Command } from "@commander-js/extra-typings";
import { describe, expect, it } from "vitest";
import {
  getGlobals,
  isQuiet,
  parsePassthrough,
  resolveStdio,
} from "../../src/lib/cli/runtime.js";

describe("CLI Runtime Utilities", () => {
  describe("resolveStdio", () => {
    it("should return 'ignore' when silent is true", () => {
      expect(resolveStdio({ silent: true })).toBe("ignore");
    });

    it("should return 'inherit' when silent is false", () => {
      expect(resolveStdio({ silent: false })).toBe("inherit");
    });

    it("should return 'inherit' when silent is undefined", () => {
      expect(resolveStdio({ silent: undefined })).toBe("inherit");
    });

    it("should return 'inherit' when quiet is true and silent is false", () => {
      expect(resolveStdio({ quiet: true, silent: false })).toBe("inherit");
    });
  });

  describe("isQuiet", () => {
    it("should return true when quiet is true", () => {
      expect(isQuiet({ quiet: true })).toBe(true);
    });

    it("should return true when silent is true", () => {
      expect(isQuiet({ silent: true })).toBe(true);
    });

    it("should return true when both quiet and silent are true", () => {
      expect(isQuiet({ quiet: true, silent: true })).toBe(true);
    });

    it("should return false when both quiet and silent are false", () => {
      expect(isQuiet({ quiet: false, silent: false })).toBe(false);
    });

    it("should return false when both quiet and silent are undefined", () => {
      expect(isQuiet({})).toBe(false);
    });
  });

  describe("parsePassthrough", () => {
    it("should return empty array when no -- separator", () => {
      const argv = ["node", "api-tools", "spectral", "lint", "spec.yaml"];
      const [input, passthrough] = parsePassthrough(argv, "spec.yaml");

      expect(input).toBe("spec.yaml");
      expect(passthrough).toEqual([]);
    });

    it("should extract passthrough arguments after --", () => {
      const argv = [
        "node",
        "api-tools",
        "spectral",
        "lint",
        "spec.yaml",
        "--",
        "--foo",
        "bar",
      ];
      const [input, passthrough] = parsePassthrough(argv, "spec.yaml");

      expect(input).toBe("spec.yaml");
      expect(passthrough).toEqual(["--foo", "bar"]);
    });

    it("should handle when input matches first passthrough token", () => {
      // this happens when command treats first passthrough token as [input] arg
      const argv = [
        "node",
        "api-tools",
        "spectral",
        "lint",
        "spec.yaml",
        "--",
        "spec.yaml",
        "--foo",
      ];
      const [input, passthrough] = parsePassthrough(argv, "spec.yaml");

      expect(input).toBeUndefined();
      expect(passthrough).toEqual(["spec.yaml", "--foo"]);
    });

    it("should handle no input with passthrough", () => {
      const argv = ["node", "api-tools", "spectral", "lint", "--", "--foo"];
      const [input, passthrough] = parsePassthrough(argv, undefined);

      expect(input).toBeUndefined();
      expect(passthrough).toEqual(["--foo"]);
    });
  });

  describe("getGlobals", () => {
    it("should extract global options from command", () => {
      const cmd = new Command()
        .option("--quiet", "Quiet mode", false)
        .option("--silent", "Silent mode", false)
        .option("--cwd <path>", "Working directory");

      cmd.parse(["node", "api-tools", "--quiet", "--cwd", "/tmp"]);

      const globals = getGlobals(cmd);

      expect(globals.quiet).toBe(true);
      expect(globals.silent).toBe(false);
      expect(globals.cwd).toBe("/tmp");
    });
  });
});
