import {
  Command,
  CommandUnknownOpts,
  Option,
} from "@commander-js/extra-typings";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ExecuteParams, runMultiDocumentCommand } from "../cli/helpers.js";
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
  runMultiDocumentCommand({
    input,
    options,
    cmd,
    resolveDocuments: resolveDocuments,
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

  // prevent using --generate-ignore-file with bundled config
  // since redocly writes the generated ignore file to the config's directory
  // and this would be difficult for users to find/manage
  if (
    config.source === "bundled" &&
    params.passthrough.some((arg) => arg.includes("--generate-ignore-file"))
  ) {
    console.error(
      `
❌ Error: Cannot use --generate-ignore-file with bundled config

The --generate-ignore-file option requires a local Redocly configuration file, but no local config was found.

To generate a starter config, run:

    api-tools redocly init

Then re-run this command.
`.trim(),
    );
    return 1;
  }

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
