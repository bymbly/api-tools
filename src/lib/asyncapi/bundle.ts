import {
  Command,
  CommandUnknownOpts,
  Option,
} from "@commander-js/extra-typings";
import path from "path";
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
  xOrigin: boolean;
}

export const bundleCommand = new Command("bundle")
  .description("Bundle AsyncAPI documents into a single file")
  .argument("[input]", "Document path (default: asyncapi/asyncapi.yaml)")

  .option(
    "--output <file>",
    "Output file or directory path (default: dist/bundle/asyncapi.yaml)",
    "dist/bundle/asyncapi.yaml",
  )
  .addOption(
    new Option(
      "--ext <extension>",
      "Output file extension (overrides extension in --output)",
    ).choices([...VALID_EXTENSIONS]),
  )
  .option(
    "--xOrigin",
    "Generate x-origin fields that contain historical values of dereferenced $ref's",
    false,
  )
  .allowExcessArguments(true)
  .action(runBundle);

function runBundle(
  input: string | undefined,
  options: Options,
  cmd: CommandUnknownOpts,
): void {
  runSingleInputCommand({
    input,
    options,
    cmd,
    defaultInput: "asyncapi/asyncapi.yaml",
    execute: bundle,
  });
}

export function bundle(params: SingleInputExecuteParams<Options>): number {
  const { input, options, globals } = params;

  const args = buildArgs(params);
  const stdio = resolveStdio(globals);
  const quiet = isQuiet(globals);

  if (!quiet) {
    console.log(`📦 AsyncAPI bundle...`);
    console.log(`   Input: ${input}`);
    console.log(`   Output: ${options.output}`);
    if (options.ext) {
      console.log(`   Extension: ${options.ext}`);
    }
    console.log(`   xOrigin: ${options.xOrigin}`);
  }

  return run(args, stdio);
}

function buildArgs(params: SingleInputExecuteParams<Options>) {
  const { input, options, passthrough } = params;

  ensureDirectoryExists(options.output);

  let outputPath = options.output;
  if (options.ext) {
    const parsed = path.parse(options.output);
    outputPath = path.join(parsed.dir, `${parsed.name}.${options.ext}`);
  }

  const args = ["bundle", input, "--output", outputPath];

  if (options.xOrigin) {
    args.push("--xOrigin");
  }

  // forward any passthrough args to spectral
  if (passthrough.length > 0) {
    args.push(...passthrough);
  }

  return args;
}
