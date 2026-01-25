import {
  Command,
  CommandUnknownOpts,
  Option,
} from "@commander-js/extra-typings";
import {
  runBatchInputCommand,
  SingleInputExecuteParams,
} from "../cli/helpers.js";
import {
  DocTypeOptions,
  isQuiet,
  ResolvedConfig,
  resolveDocuments,
  resolveStdio,
} from "../cli/runtime.js";
import { resolveConfig, run } from "./cli.js";

export const VALID_OUTPUT_FORMATS = [
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

type OutputFormat = (typeof VALID_OUTPUT_FORMATS)[number];
type FailSeverity = (typeof VALID_FAIL_SEVERITIES)[number];

export interface Options extends DocTypeOptions {
  format: OutputFormat;
  output?: string;
  ruleset?: string;
  failSeverity: FailSeverity;
  displayOnlyFailures: boolean;
  verbose: boolean;
}

export const lintCommand = new Command("lint")
  .description(
    "Validate and lint OpenAPI, AsyncAPI, and Arazzo Documents using Spectral",
  )
  .argument("[input]", "Document path (default: auto-detect)")

  .option("--openapi", "Lint OpenAPI document at openapi/openapi.yaml", false)
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
  .action(runLint);

function runLint(
  input: string | undefined,
  options: Options,
  cmd: CommandUnknownOpts,
): void {
  runBatchInputCommand({
    input,
    options,
    cmd,
    resolveDocuments: resolveDocuments,
    execute: lint,
  });
}

export function lint(params: SingleInputExecuteParams<Options>): number {
  const { input, options, globals } = params;

  const ruleset = resolveConfig(options.ruleset);

  const args = buildArgs(params, ruleset);

  const stdio = resolveStdio(globals);
  const quiet = isQuiet(globals);

  if (!quiet) {
    console.log(`🔍 Spectral lint...`);
    console.log(`   Input: ${input}`);
    console.log(`   Format: ${options.format}`);
    console.log(`   Ruleset: ${ruleset.path ?? "auto"} (${ruleset.source})`);
    if (options.output) {
      console.log(`   Output: ${options.output}`);
    }
    console.log(`   Fail Severity: ${options.failSeverity}`);
    console.log(
      `   Display Only Failures: ${String(options.displayOnlyFailures)}`,
    );
    console.log(`   Verbose: ${String(options.verbose)}`);
  }

  return run(args, stdio);
}

function buildArgs(
  params: SingleInputExecuteParams<Options>,
  ruleset: ResolvedConfig,
): string[] {
  const { input, options, passthrough } = params;

  const args = [
    "lint",
    input,
    "--format",
    options.format,
    "--fail-severity",
    options.failSeverity,
  ];

  // only pass --ruleset if we resolved an explicit path (cli or bundled)
  if (ruleset.path) args.push("--ruleset", ruleset.path);

  if (options.output) args.push("--output", options.output);
  if (options.displayOnlyFailures) args.push("--display-only-failures");
  if (options.verbose) args.push("--verbose");

  // forward any passthrough args to spectral
  if (passthrough.length > 0) {
    args.push(...passthrough);
  }

  return args;
}
