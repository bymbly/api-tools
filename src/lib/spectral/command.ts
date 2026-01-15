import {
  Command,
  CommandUnknownOpts,
  Option,
} from "@commander-js/extra-typings";
import { handleRawPassthrough, runMultiInputCommand } from "../cli/helpers.js";
import { resolveDocuments } from "../cli/runtime.js";
import {
  FailSeverity,
  lintSpectral,
  OutputFormat,
  SpectralLintCliOptions,
  spectralPassthrough,
  VALID_FAIL_SEVERITIES,
  VALID_OUTPUT_FORMATS,
} from "./lint.js";

export const spectralCommand = new Command("spectral")
  .description("Spectral-related commands")
  .allowExcessArguments(true)
  .action((opts, cmd) => {
    handleRawPassthrough(opts, cmd, spectralPassthrough);
  })

  .addCommand(
    new Command("lint")
      .description(
        "Validate and lint OpenAPI v2 & v3.x, AsyncAPI, and Arazzo v1 Documents using Spectral",
      )
      .argument("[input]", "Document path (default: auto-detect)")

      .option(
        "--openapi",
        "Lint OpenAPI document at openapi/openapi.yaml",
        false,
      )
      .option(
        "--asyncapi",
        "Lint AsyncAPI document at asyncapi/asyncapi.yaml",
        false,
      )
      .option("--arazzo", "Lint Arazzo document at arazzo/arazzo.yaml", false)

      .addOption(
        new Option("--format <format>", "Output format")
          .choices([...VALID_OUTPUT_FORMATS])
          .default("stylish" satisfies OutputFormat),
      )
      .option("--output <file>", "Write output to a file")
      .option("--ruleset <file>", "Ruleset file path (overrides auto/bundled)")
      .addOption(
        new Option("--fail-severity <level>", "Fail severity threshold")
          .choices([...VALID_FAIL_SEVERITIES])
          .default("warn" satisfies FailSeverity),
      )
      .option("--display-only-failures", "Display only failing results", false)
      .option("--verbose", "Enable verbose output", false)
      .allowExcessArguments(true)
      .action(runSpectralLint),
  );

function runSpectralLint(
  input: string | undefined,
  options: SpectralLintCliOptions,
  cmd: CommandUnknownOpts,
): void {
  runMultiInputCommand({
    input,
    options,
    cmd,
    resolveInputs: resolveDocuments,
    execute: lintSpectral,
  });
}
