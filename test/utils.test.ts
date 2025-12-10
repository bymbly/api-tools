import fs from "fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPath } from "../src/lib/utils.js";

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
});
