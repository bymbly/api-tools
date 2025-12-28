import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lint } from "../../src/lib/spectral/lint.js";

describe("Lint Integration Tests", () => {
  const originalEnv = process.env;
  const originalCwd = process.cwd();
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(process.cwd(), "test-temp-"));
    process.chdir(tempDir);
    process.env = { ...originalEnv };
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    process.env.SPECTRAL_STDIO = "silent";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.chdir(originalCwd);
    process.env = originalEnv;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe("valid specs", () => {
    it("should pass for simple valid spec with bundled default config", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        {
          recursive: true,
        },
      );

      expect(() => lint()).not.toThrow();
    });

    it("should pass for spec with references with bundled default config", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/spec-with-refs"),
        path.join(tempDir, "openapi"),
        {
          recursive: true,
        },
      );

      expect(() => lint()).not.toThrow();
    });

    it("should pass when local .spectral.yaml exists", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        {
          recursive: true,
        },
      );

      fs.cpSync(
        path.join(originalCwd, "defaults/spectral.yaml"),
        path.join(tempDir, ".spectral.yaml"),
      );

      expect(() => lint()).not.toThrow();
    });

    it("should pass when local spectral.yaml exists", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        {
          recursive: true,
        },
      );

      fs.cpSync(
        path.join(originalCwd, "defaults/spectral.yaml"),
        path.join(tempDir, "spectral.yaml"),
      );

      expect(() => lint()).not.toThrow();
    });

    it("should pass when local .spectral.json exists", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        {
          recursive: true,
        },
      );

      fs.writeFileSync(
        path.join(tempDir, ".spectral.json"),
        JSON.stringify({
          extends: [["spectral:oas", "recommended"]],
        }),
      );

      expect(() => lint()).not.toThrow();
    });
  });

  describe("invalid specs", () => {
    it("should fail for invalid spec with bundled default config", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/invalid/broken-spec"),
        path.join(tempDir, "openapi"),
        {
          recursive: true,
        },
      );

      expect(lint()).not.toBe(0);
    });
  });

  describe("custom config", () => {
    it("should work with custom input path", () => {
      fs.mkdirSync(path.join(tempDir, "custom"), { recursive: true });
      fs.copyFileSync(
        path.join(
          originalCwd,
          "test/fixtures/openapi/valid/simple-spec/openapi.yaml",
        ),
        path.join(tempDir, "custom/spec.yaml"),
      );

      process.env.OPENAPI_INPUT = "custom/spec.yaml";

      expect(() => lint()).not.toThrow();
    });

    it("should work with custom config path", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        {
          recursive: true,
        },
      );

      fs.cpSync(
        path.join(originalCwd, "defaults/spectral.yaml"),
        path.join(tempDir, "custom-spectral.yaml"),
      );

      process.env.OPENAPI_CONFIG = "custom-spectral.yaml";

      expect(() => lint()).not.toThrow();
    });

    it("should work with custom fail severity", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        {
          recursive: true,
        },
      );

      process.env.SPECTRAL_FAIL_SEVERITY = "error";

      expect(() => lint()).not.toThrow();
    });

    it("should work with custom output format", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        {
          recursive: true,
        },
      );

      process.env.SPECTRAL_FORMAT = "json";
      process.env.OPENAPI_OUTPUT = "lint-results.json";

      expect(() => lint()).not.toThrow();
      expect(fs.existsSync(path.join(tempDir, "lint-results.json"))).toBe(true);
      expect(
        fs.statSync(path.join(tempDir, "lint-results.json")).size,
      ).toBeGreaterThan(0);
      JSON.parse(
        fs.readFileSync(path.join(tempDir, "lint-results.json"), "utf8"),
      );
    });

    it("should work with display-only-failures enabled", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        {
          recursive: true,
        },
      );

      process.env.SPECTRAL_DISPLAY_ONLY_FAILURES = "true";

      expect(() => lint()).not.toThrow();
    });

    it("should work with verbose enabled", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        {
          recursive: true,
        },
      );

      process.env.SPECTRAL_VERBOSE = "true";

      expect(() => lint()).not.toThrow();
    });

    it("should output to a file when OPENAPI_OUTPUT is set", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        {
          recursive: true,
        },
      );

      process.env.OPENAPI_OUTPUT = "lint-results.json";

      expect(() => lint()).not.toThrow();
      expect(fs.existsSync(path.join(tempDir, "lint-results.json"))).toBe(true);
    });

    it("should work with all custom options together", () => {
      fs.mkdirSync(path.join(tempDir, "custom"), { recursive: true });
      fs.copyFileSync(
        path.join(
          originalCwd,
          "test/fixtures/openapi/valid/simple-spec/openapi.yaml",
        ),
        path.join(tempDir, "custom/spec.yaml"),
      );

      fs.cpSync(
        path.join(originalCwd, "defaults/spectral.yaml"),
        path.join(tempDir, "custom-spectral.yaml"),
      );

      process.env.OPENAPI_INPUT = "custom/spec.yaml";
      process.env.OPENAPI_CONFIG = "custom-spectral.yaml";
      process.env.SPECTRAL_FAIL_SEVERITY = "error";
      process.env.SPECTRAL_FORMAT = "json";
      process.env.OPENAPI_OUTPUT = "lint-results.json";
      process.env.SPECTRAL_DISPLAY_ONLY_FAILURES = "true";
      process.env.SPECTRAL_VERBOSE = "true";

      expect(() => lint()).not.toThrow();
    });
  });

  describe("bundled default config", () => {
    it("should use bundled default config when no local config exists", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        {
          recursive: true,
        },
      );

      expect(() => lint()).not.toThrow();
    });

    it("should prefer local config over bundled default config", () => {
      fs.cpSync(
        path.join(originalCwd, "test/fixtures/openapi/valid/simple-spec"),
        path.join(tempDir, "openapi"),
        {
          recursive: true,
        },
      );

      fs.cpSync(
        path.join(originalCwd, "defaults/spectral.yaml"),
        path.join(tempDir, ".spectral.yaml"),
      );

      expect(() => lint()).not.toThrow();
    });
  });
});
