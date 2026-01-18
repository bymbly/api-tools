import {
  Command,
  CommandUnknownOpts,
  Option,
} from "@commander-js/extra-typings";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ExecuteParams, runMultiInputCommand } from "../cli/helpers.js";
import {
  DocTypeOptions,
  isQuiet,
  resolveConfig,
  ResolvedConfig,
  resolveDocuments,
  resolveStdio,
} from "../cli/runtime.js";
import { run } from "./cli.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REDOCLY_CONFIG_REGEX = /^\.?redocly\.ya?ml$/;

const defaultConfigPath = path.join(__dirname, "../../defaults/redocly.yaml");

export const VALID_OUTPUT_FORMATS = [
  "codeframe",
  "stylish",
  "json",
  "checkstyle",
  "codeclimate",
  "github-actions",
  "markdown",
  "summary",
] as const;

export type OutputFormat = (typeof VALID_OUTPUT_FORMATS)[number];

export interface RedoclyLintCliOptions extends DocTypeOptions {
  format: OutputFormat;
  config?: string;
}

export const lintCommand = new Command("lint")
  .description(
    "Validate and lint OpenAPI, AsyncAPI, Arazzo documents using Redocly",
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
      .default("codeframe" satisfies OutputFormat),
  )
  .option("--config <file>", "Config file path (overrides auto/bundled)")
  .allowExcessArguments(true)
  .action(runRedoclyLint);

function runRedoclyLint(
  input: string | undefined,
  options: RedoclyLintCliOptions,
  cmd: CommandUnknownOpts,
): void {
  runMultiInputCommand({
    input,
    options,
    cmd,
    resolveInputs: resolveDocuments,
    execute: lint,
  });
}

function lint(params: ExecuteParams<RedoclyLintCliOptions>): number {
  const { input, options, globals } = params;

  const config = resolveConfig(
    options.config,
    REDOCLY_CONFIG_REGEX,
    defaultConfigPath,
  );

  const redoclyArgs = buildArgs(params, config);

  const stdio = resolveStdio(globals);
  const quiet = isQuiet(globals);

  if (!quiet) {
    console.log("🔍 Redocly lint...");
    console.log(`   Input: ${input}`);
    console.log(`   Format: ${options.format}`);
    console.log(`   Config: ${config.path ?? "auto"} (${config.source})`);
  }

  return run(redoclyArgs, stdio);
}

function buildArgs(
  params: ExecuteParams<RedoclyLintCliOptions>,
  config: ResolvedConfig,
): string[] {
  const { input, options, passthrough } = params;

  const args = ["lint", input, "--format", options.format];

  // only pass --config if we resolved an explicit path (cli or bundled)
  if (config.path) args.push("--config", config.path);

  // forward any passthrough args to redocly
  if (passthrough.length > 0) {
    args.push(...passthrough);
  }

  return args;
}
