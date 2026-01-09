import { Command, Option } from "@commander-js/extra-typings";
import { getGlobals, parsePassthrough, resolveStdio } from "../cli/runtime.js";
import { lintSpectral, spectralPassthrough } from "./lint.js";

const VALID_OUTPUT_FORMATS = [
  "json",
  "stylish",
  "junit",
  "html",
  "text",
  "teamcity",
  "pretty",
  "github-actions",
  "sarif",
  "markdown",
  "gitlab",
] as const;

const VALID_FAIL_SEVERITIES = ["error", "warn", "info", "hint"] as const;

export type OutputFormat = (typeof VALID_OUTPUT_FORMATS)[number];
export type FailSeverity = (typeof VALID_FAIL_SEVERITIES)[number];

export interface SpectralLintCliOptions {
  format: OutputFormat;
  output?: string;
  ruleset?: string;
  failSeverity: FailSeverity;
  displayOnlyFailures: boolean;
  verbose: boolean;
}

export const spectralCommand = new Command("spectral")
  .description("Spectral-related commands")
  .allowExcessArguments(true)
  .action(rawSpectral)

  .addCommand(
    new Command("lint")
      .description(
        "Validate and lint OpenAPI v2 & v3.x, AsyncAPI, and Arazzo v1 Documents using Spectral",
      )
      .argument("[input]", "Spec path (default: openapi/openapi.yaml)")

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

function rawSpectral(_options: unknown, cmd: Command): void {
  const [, passthrough] = parsePassthrough(process.argv, undefined);

  if (passthrough.length === 0) {
    cmd.help();
  }

  const globals = getGlobals(cmd);
  const stdio = resolveStdio(globals);

  const code = spectralPassthrough(passthrough, stdio);
  process.exitCode = code;
}

function runSpectralLint(
  input: string | undefined,
  options: SpectralLintCliOptions,
  cmd: Command<[string | undefined], SpectralLintCliOptions>,
): void {
  const globals = getGlobals(cmd);

  let passthrough: string[];
  [input, passthrough] = parsePassthrough(process.argv, input);

  const code = lintSpectral({
    input,
    options,
    globals,
    passthrough,
  });

  process.exitCode = code;
}
