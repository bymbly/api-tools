import {
  Command,
  CommandUnknownOpts,
  Option,
} from "@commander-js/extra-typings";
import path from "node:path";
import {
  runSingleInputCommand,
  SingleInputExecuteParams,
} from "../cli/helpers.js";
import {
  ensureDirectoryExists,
  isQuiet,
  resolveStdio,
} from "../cli/runtime.js";
import { run } from "./cli.js";

const VALID_EXTENSIONS = ["json", "yaml", "yml"] as const;

type OutputExtension = (typeof VALID_EXTENSIONS)[number];

export interface Options {
  output: string;
  ext?: OutputExtension;
}

export const formatCommand = new Command("format")
  .description(
    "Convert AsyncAPI documents from any format to yaml, yml or JSON",
  )
  .argument("[input]", "Document path (default: asyncapi/asyncapi.yaml)")

  .option(
    "--output <file>",
    "Output file path (default: dist/format/asyncapi.json)",
    "dist/format/asyncapi.json",
  )
  .addOption(
    new Option(
      "--ext <extension>",
      "Output file extension (overrides extension in --output)",
    ).choices([...VALID_EXTENSIONS]),
  )
  .allowExcessArguments(true)
  .action(runFormat);

function runFormat(
  input: string | undefined,
  options: Options,
  cmd: CommandUnknownOpts,
): void {
  runSingleInputCommand({
    input,
    options,
    cmd,
    defaultInput: "asyncapi/asyncapi.yaml",
    execute: format,
  });
}

export function format(params: SingleInputExecuteParams<Options>): number {
  const { input, options, globals } = params;

  ensureDirectoryExists(options.output);

  const args = buildArgs(params);
  const stdio = resolveStdio(globals);
  const quiet = isQuiet(globals);

  if (!quiet) {
    console.log(`📝 AsyncAPI format...`);
    console.log(`   Input: ${input}`);
    console.log(`   Output: ${getOutputPath(options)}`);
    if (options.ext) {
      console.log(`   Extension: ${options.ext}`);
    }
  }

  return run(args, stdio);
}

function buildArgs(params: SingleInputExecuteParams<Options>) {
  const { input, options, passthrough } = params;

  const args = ["format", input];

  args.push("--output", getOutputPath(options));

  if (options.ext) {
    args.push("--format", options.ext);
  }

  // forward any passthrough args
  if (passthrough.length > 0) {
    args.push(...passthrough);
  }

  return args;
}

function getOutputPath(options: Options): string {
  if (options.ext) {
    const parsed = path.parse(options.output);
    return path.join(parsed.dir, `${parsed.name}.${options.ext}`);
  }
  return options.output;
}
