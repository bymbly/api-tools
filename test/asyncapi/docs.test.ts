import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { docs, Options } from "../../src/lib/asyncapi/generate/docs.js";
import * as FromTemplateCommand from "../../src/lib/asyncapi/generate/from-template.js";
import { withDefaults } from "../helper.js";

vi.mock("../../src/lib/asyncapi/generate/from-template.js");

const createRun = withDefaults<string, Options>("asyncapi/asyncapi.yaml", {
  output: "dist/docs/asyncapi.html",
  params: [],
  singleFile: true,
});

describe("AsyncAPI Docs Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(vi.fn());
    vi.spyOn(FromTemplateCommand, "fromTemplate").mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("docs", () => {
    it("should use provided input", () => {
      const run = createRun();

      docs(run);

      expect(FromTemplateCommand.fromTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          input: "asyncapi/asyncapi.yaml",
        }),
      );
    });

    it("should use custom input when provided", () => {
      const run = createRun({ input: "custom/spec.yaml" });

      docs(run);

      expect(FromTemplateCommand.fromTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          input: "custom/spec.yaml",
        }),
      );
    });

    it("should use HTML template", () => {
      const run = createRun();

      docs(run);

      expect(FromTemplateCommand.fromTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            template: "@asyncapi/html-template@latest",
          }),
        }),
      );
    });

    it("should set forceWrite to true", () => {
      const run = createRun();

      docs(run);

      expect(FromTemplateCommand.fromTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            forceWrite: true,
          }),
        }),
      );
    });

    it("should parse output path and set directory for single file", () => {
      const run = createRun({ options: { output: "dist/docs/api.html" } });

      docs(run);

      expect(FromTemplateCommand.fromTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            output: "dist/docs",
          }),
        }),
      );
    });

    it("should add singleFile param when enabled", () => {
      const run = createRun({ options: { singleFile: true } });

      docs(run);

      expect(FromTemplateCommand.fromTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            params: expect.arrayContaining(["singleFile=true"]),
          }),
        }),
      );
    });

    it("should add outFilename param with parsed filename", () => {
      const run = createRun({
        options: { output: "dist/docs/asyncapi.html", singleFile: true },
      });

      docs(run);

      expect(FromTemplateCommand.fromTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            params: expect.arrayContaining(["outFilename=asyncapi.html"]),
          }),
        }),
      );
    });

    it("should use custom filename from output path", () => {
      const run = createRun({
        options: { output: "custom/my-api.html", singleFile: true },
      });

      docs(run);

      expect(FromTemplateCommand.fromTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            output: "custom",
            params: expect.arrayContaining(["outFilename=my-api.html"]),
          }),
        }),
      );
    });

    it("should create subdirectory for multi-file output", () => {
      const run = createRun({
        options: { output: "dist/docs/api.html", singleFile: false },
      });

      docs(run);

      expect(FromTemplateCommand.fromTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            output: "dist/docs/asyncapi",
          }),
        }),
      );
    });

    it("should not add singleFile params when disabled", () => {
      const run = createRun({ options: { singleFile: false } });

      docs(run);

      const call = vi.mocked(FromTemplateCommand.fromTemplate).mock.calls[0][0];
      expect(call.options.params).not.toContain("singleFile=true");
      expect(
        call.options.params.some((p) => p.startsWith("outFilename=")),
      ).toBe(false);
    });

    it("should merge user-provided params", () => {
      const run = createRun({
        options: { params: ["version=1.0.0", "title=My API"] },
      });

      docs(run);

      expect(FromTemplateCommand.fromTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            params: expect.arrayContaining([
              "singleFile=true",
              expect.stringContaining("outFilename="),
              "version=1.0.0",
              "title=My API",
            ]),
          }),
        }),
      );
    });

    it("should use current directory when no directory in output path", () => {
      const run = createRun({ options: { output: "asyncapi.html" } });

      docs(run);

      expect(FromTemplateCommand.fromTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            output: ".",
          }),
        }),
      );
    });

    it("should suppress wrapper logging when quiet", () => {
      const logSpy = vi.spyOn(console, "log");

      const run = createRun({ globals: { quiet: true, silent: false } });

      docs(run);

      expect(logSpy).not.toHaveBeenCalled();
    });

    it("should show wrapper logging when not quiet", () => {
      const logSpy = vi.spyOn(console, "log");

      const run = createRun({ globals: { quiet: false, silent: false } });

      docs(run);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("AsyncAPI generate docs"),
      );
    });

    it("should set quiet flag before delegating to fromTemplate", () => {
      const run = createRun({ globals: { quiet: false, silent: false } });

      docs(run);

      const call = vi.mocked(FromTemplateCommand.fromTemplate).mock.calls[0][0];
      expect(call.globals.quiet).toBe(true);
    });

    it("should return exit code from fromTemplate", () => {
      vi.mocked(FromTemplateCommand.fromTemplate).mockReturnValue(42);

      const run = createRun();

      expect(docs(run)).toBe(42);
    });

    it("should forward passthrough args", () => {
      const run = createRun({ passthrough: ["--debug"] });

      docs(run);

      expect(FromTemplateCommand.fromTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          passthrough: ["--debug"],
        }),
      );
    });
  });
});
