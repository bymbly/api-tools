import fs from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bundle } from "../../src/lib/redocly/bundle.js";

describe("Bundle Integration Tests", () => {
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

  describe("simple spec without references", () => {
    beforeEach(() => {
      const fixturePath = path.join(
        originalCwd,
        "test/fixtures/openapi/valid/simple-spec",
      );
      fs.cpSync(fixturePath, path.join(tempDir, "openapi"), {
        recursive: true,
      });
    });

    it("should bundle YAML format by default", () => {
      bundle();

      expect(fs.existsSync("dist/openapi.yaml")).toBe(true);

      const bundled = fs.readFileSync("dist/openapi.yaml", "utf-8");

      expect(bundled).toContain("openapi: 3.1.1");
      expect(bundled).toContain("title: Simple Test API");
      expect(bundled).toContain("/test:");

      expect(bundled).toMatchSnapshot();
    });

    it("should bundle JSON format when specified", () => {
      process.env.OPENAPI_FORMAT = "json";

      bundle();

      expect(fs.existsSync("dist/openapi.json")).toBe(true);

      const bundled = fs.readFileSync("dist/openapi.json", "utf-8");

      const parsed = JSON.parse(bundled);
      expect(parsed.openapi).toBe("3.1.1");
      expect(parsed.info.title).toBe("Simple Test API");
      expect(parsed.paths["/test"]).toBeDefined();

      expect(bundled).toMatchSnapshot();
    });

    it("should use custom output path when specified", () => {
      process.env.OPENAPI_OUTPUT = "custom/output/openapi-spec";

      bundle();

      expect(fs.existsSync("custom/output/openapi-spec.yaml")).toBe(true);
      expect(fs.existsSync("dist/openapi.yaml")).toBe(false);
    });
  });

  describe("spec with $ref references", () => {
    beforeEach(() => {
      const fixturePath = path.join(
        originalCwd,
        "test/fixtures/openapi/valid/spec-with-refs",
      );
      fs.cpSync(fixturePath, path.join(tempDir, "openapi"), {
        recursive: true,
      });
    });

    it("should resolve and bundle external references", () => {
      bundle();

      const bundled = fs.readFileSync("dist/openapi.yaml", "utf-8");

      expect(bundled).toContain("openapi: 3.1.1");
      expect(bundled).toContain("title: Test API with References");
      expect(bundled).toContain("/test:");
      expect(bundled).toContain("components:");
      expect(bundled).toContain("schemas:");
      expect(bundled).toContain("TestSchema:");
      expect(bundled).toContain("id:");
      expect(bundled).toContain("name:");

      expect(bundled).toMatchSnapshot();
    });

    it("should produce valid bundled JSON", () => {
      process.env.OPENAPI_FORMAT = "json";

      bundle();

      const bundled = fs.readFileSync("dist/openapi.json", "utf-8");

      const parsed = JSON.parse(bundled);
      expect(parsed.openapi).toBe("3.1.1");
      expect(parsed.info.title).toBe("Test API with References");
      expect(parsed.paths["/test"]).toBeDefined();
      expect(parsed.components.schemas.TestSchema).toBeDefined();
      expect(parsed.components.schemas.TestSchema.properties.id).toBeDefined();
      expect(
        parsed.components.schemas.TestSchema.properties.name,
      ).toBeDefined();

      expect(bundled).toMatchSnapshot();
    });
  });

  describe("error handling", () => {
    it("should handle missing input file gracefully", () => {
      process.env.OPENAPI_INPUT = "nonexistent/path/openapi.yaml";

      const mockExit = vi
        .spyOn(process, "exit")
        .mockImplementation(() => undefined as never);

      bundle();

      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it("should handle invalid YAML gracefully", () => {
      fs.mkdirSync("openapi", { recursive: true });
      fs.writeFileSync(
        "openapi/openapi.yaml",
        "this is not: valid: yamle: content:",
      );

      const mockExit = vi
        .spyOn(process, "exit")
        .mockImplementation(() => undefined as never);

      bundle();

      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });
  });
});
