import { Command, CommandUnknownOpts } from "@commander-js/extra-typings";
import { ExecuteParams, runSingleDocumentCommand } from "../cli/helpers.js";
import {
  ensureDirectoryExists,
  isQuiet,
  resolveStdio,
} from "../cli/runtime.js";
import { run } from "./cli.js";

export interface Options {
  output: string;
}

export const generateArazzoCommand = new Command("generate-arazzo")
  .description(
    "Generate Arazzo workflow description from an OpenAPI document using Redocly (requires manual editing to be functional)",
  )
  .argument("[input]", "OpenAPI document path (default: openapi/openapi.yaml)")

  .option(
    "--output <file>",
    "Output file path",
    "arazzo/auto-generated.arazzo.yaml",
  )
  .allowExcessArguments(true)
  .action(runGenerateArazzo);

function runGenerateArazzo(
  input: string | undefined,
  options: Options,
  cmd: CommandUnknownOpts,
): void {
  runSingleDocumentCommand({
    input,
    options,
    cmd,
    defaultInput: "openapi/openapi.yaml",
    execute: generateArazzo,
  });
}

export function generateArazzo(params: ExecuteParams<Options>): number {
  const { input, options, globals } = params;

  ensureDirectoryExists(options.output);

  const args = buildArgs(params);
  const stdio = resolveStdio(globals);
  const quiet = isQuiet(globals);

  if (!quiet) {
    console.log(`🔄 Redocly generate-arazzo...`);
    console.log(`   Input: ${input}`);
    console.log(`   Output: ${options.output}`);
  }

  return run(args, stdio);
}

function buildArgs(params: ExecuteParams<Options>): string[] {
  const { input, options, passthrough } = params;

  const args = ["generate-arazzo", input, "--output-file", options.output];

  // forward any passthrough args to redocly
  if (passthrough.length > 0) {
    args.push(...passthrough);
  }

  return args;
}
