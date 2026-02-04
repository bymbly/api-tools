import {
  Command,
  CommandUnknownOpts,
  Option,
} from "@commander-js/extra-typings";
import {
  runSingleInputCommand,
  SingleInputExecuteParams,
} from "../cli/helpers.js";
import { isQuiet, resolveStdio } from "../cli/runtime.js";
import { run } from "./cli.js";

const VALID_OUTPUT_FORMATS = [
  "json",
  "stylish",
  "junit",
  "html",
  "teamcity",
  "pretty",
  "github-actions",
  "sarif",
  "code-climate",
  "gitlab",
  "markdown",
] as const;

const VALID_FAIL_SEVERITIES = ["error", "warn", "info", "hint"] as const;

type OutputFormat = (typeof VALID_OUTPUT_FORMATS)[number];
type FailSeverity = (typeof VALID_FAIL_SEVERITIES)[number];

export interface Options {
  format: OutputFormat;
  output?: string;
  failSeverity: FailSeverity;
}

export const validateCommand = new Command("validate")
  .description("Validate AsyncAPI documents")
  .argument("[input]", "Document path (default: asyncapi/asyncapi.yaml)")

  .addOption(
    new Option("--format <format>", "Output format")
      .choices([...VALID_OUTPUT_FORMATS])
      .default("stylish" satisfies OutputFormat),
  )
  .option("--output <file>", "Write output to a file")
  .addOption(
    new Option("--fail-severity <level>", "Fail severity threshold")
      .choices([...VALID_FAIL_SEVERITIES])
      .default("warn" satisfies FailSeverity),
  )
  .allowExcessArguments(true)
  .action(runValidate);

function runValidate(
  input: string | undefined,
  options: Options,
  cmd: CommandUnknownOpts,
): void {
  runSingleInputCommand({
    input,
    options,
    cmd,
    defaultInput: "asyncapi/asyncapi.yaml",
    execute: validate,
  });
}

export function validate(params: SingleInputExecuteParams<Options>): number {
  const { input, options, globals } = params;

  const args = buildArgs(params);
  const stdio = resolveStdio(globals);
  const quiet = isQuiet(globals);

  if (!quiet) {
    console.log(`🔍 AsyncAPI validate...`);
    console.log(`   Input: ${input}`);
    console.log(`   Format: ${options.format}`);
    if (options.output) {
      console.log(`   Output: ${options.output}`);
    }
    console.log(`   Fail severity: ${options.failSeverity}`);
  }

  return run(args, stdio);
}

function buildArgs(params: SingleInputExecuteParams<Options>) {
  const { input, options, passthrough } = params;

  const args = [
    "validate",
    input,
    "--diagnostics-format",
    options.format,
    "--fail-severity",
    options.failSeverity,
  ];

  if (options.output) {
    args.push("--save-output", options.output);
  }

  // forward any passthrough args
  if (passthrough.length > 0) {
    args.push(...passthrough);
  }

  return args;
}
