import { Command, CommandUnknownOpts } from "@commander-js/extra-typings";
import {
  runSingleInputCommand,
  SingleInputExecuteParams,
} from "../cli/helpers.js";
import { isQuiet, ResolvedConfig, resolveStdio } from "../cli/runtime.js";
import { resolveConfig, run } from "./cli.js";

export interface Options {
  output: string;
  config?: string;
}

export const buildDocsCommand = new Command("build-docs")
  .description("Build HTML documentation from OpenAPI documents using Redocly")
  .argument("[input]", "OpenAPI document path (default: openapi/openapi.yaml)")

  .option("--output <file>", "Output HTML file path", "dist/docs/openapi.html")
  .option("--config <file>", "Config file path (overrides auto/bundled)")
  .allowExcessArguments(true)
  .action(runBuildDocs);

function runBuildDocs(
  input: string | undefined,
  options: Options,
  cmd: CommandUnknownOpts,
): void {
  runSingleInputCommand({
    input,
    options,
    cmd,
    defaultInput: "openapi/openapi.yaml",
    execute: buildDocs,
  });
}

export function buildDocs(params: SingleInputExecuteParams<Options>): number {
  const { input, options, globals } = params;

  const config = resolveConfig(options.config);
  const args = buildArgs(params, config);
  const stdio = resolveStdio(globals);
  const quiet = isQuiet(globals);

  if (!quiet) {
    console.log(`📚 Redocly build-docs...`);
    console.log(`   Input: ${input}`);
    console.log(`   Output: ${options.output}`);
    console.log(`   Config: ${config.path ?? "auto"} (${config.source})`);
  }

  return run(args, stdio);
}

function buildArgs(
  params: SingleInputExecuteParams<Options>,
  config: ResolvedConfig,
): string[] {
  const { input, options, passthrough } = params;

  const args = ["build-docs", input, "--output", options.output];

  // only pass --config if we resolved an explicit path (cli or bundled)
  if (config.path) args.push("--config", config.path);

  // forward any passthrough args to redocly
  if (passthrough.length > 0) {
    args.push(...passthrough);
  }

  return args;
}
