import fs from "fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPath, createValidator } from "../src/lib/utils.js";

vi.mock("fs");

describe("Utils Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createPath", () => {
    it("should create directory if it does not exist", () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.mkdirSync).mockImplementation(() => undefined);

      createPath("some/path/to/file.yaml");

      expect(fs.existsSync).toHaveBeenCalledWith("some/path/to");
      expect(fs.mkdirSync).toHaveBeenCalledWith("some/path/to", {
        recursive: true,
      });
    });

    it("should not create directory if it already exists", () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      createPath("some/path/to/file.yaml");

      expect(fs.existsSync).toHaveBeenCalledWith("some/path/to");
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    it("should handle nested paths correctly", () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.mkdirSync).mockImplementation(() => undefined);

      createPath("a/b/c/d/e/file.yaml");

      expect(fs.existsSync).toHaveBeenCalledWith("a/b/c/d/e");
    });
  });

  describe("createValidator", () => {
    it("should validate values that are in the array", () => {
      const validator = createValidator(["a", "b", "c"] as const);

      expect(validator.isValid("a")).toBe(true);
      expect(validator.isValid("b")).toBe(true);
      expect(validator.isValid("c")).toBe(true);
    });

    it("should invalidate values that are not in the array", () => {
      const validator = createValidator(["a", "b", "c"] as const);

      expect(validator.isValid("d")).toBe(false);
      expect(validator.isValid("e")).toBe(false);
      expect(validator.isValid("f")).toBe(false);
    });

    it("should be case-sensitive", () => {
      const validator = createValidator(["a", "b", "c"] as const);

      expect(validator.isValid("A")).toBe(false);
      expect(validator.isValid("B")).toBe(false);
      expect(validator.isValid("C")).toBe(false);
    });

    it("should expose the values array", () => {
      const values = ["x", "y", "z"] as const;
      const validator = createValidator(values);

      expect(validator.values).toEqual(values);
    });
  });
});
