import { Command } from "@commander-js/extra-typings";
import { runDocs } from "./generate/docs.js";

export const buildDocsCommand = new Command("build-docs")
  .description(
    "Build HTML documentation from AsyncAPI document (alias for generate docs)",
  )
  .argument(
    "[input]",
    "AsyncAPI document path (default: asyncapi/asyncapi.yaml)",
  )

  .option(
    "--output <file>",
    "Output HTML file path (default: dist/docs/asyncapi.html)",
    "dist/docs/asyncapi.html",
  )
  .option(
    "--params <key=value...>",
    "Additional params to pass to the template",
    (val, prev): string[] => {
      return prev.concat([val]);
    },
    [],
  )
  .option(
    "--single-file",
    "Generate a single HTML file instead of multiple files",
    true,
  )
  .option(
    "--no-single-file",
    "Generate multiple files (overrides --single-file)",
    false,
  )
  .allowExcessArguments(true)
  .action(runDocs);
