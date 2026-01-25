import {
  Command,
  CommandUnknownOpts,
  Option,
} from "@commander-js/extra-typings";
import {
  runSingleInputCommand,
  SingleInputExecuteParams,
} from "../cli/helpers.js";
import { isQuiet, ResolvedConfig, resolveStdio } from "../cli/runtime.js";
import { resolveConfig, run } from "./cli.js";

const VALID_EXTENSIONS = ["json", "yaml", "yml"] as const;

type OutputExtension = (typeof VALID_EXTENSIONS)[number];

export interface Options {
  output: string;
  ext?: OutputExtension;
  config?: string;
  dereferenced: boolean;
}

export const bundleCommand = new Command("bundle")
  .description("Bundle API descriptions into a single file using Redocly")
  .argument("[input]", "Document path (default: openapi/openapi.yaml)")

  .option(
    "--output <file>",
    "Output file or directory path (default: dist/bundle/openapi.yaml)",
    "dist/bundle/openapi.yaml",
  )
  .addOption(
    new Option(
      "--ext <extension>",
      "Output file extension (overrides extension in --output)",
    ).choices([...VALID_EXTENSIONS]),
  )
  .option("--config <file>", "Config file path (overrides auto/bundled)")
  .option(
    "--dereferenced",
    "Generate fully dereferenced bundle (no $ref)",
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
    defaultInput: "openapi/openapi.yaml",
    execute: bundle,
  });
}

export function bundle(params: SingleInputExecuteParams<Options>): number {
  const { input, options, globals } = params;

  const config = resolveConfig(options.config);
  const args = buildArgs(params, config);
  const stdio = resolveStdio(globals);
  const quiet = isQuiet(globals);

  if (!quiet) {
    console.log(`📦 Redocly bundle...`);
    console.log(`   Input: ${input}`);
    console.log(`   Output: ${options.output}`);
    if (options.ext) {
      console.log(`   Extension: ${options.ext}`);
    }
    console.log(`   Config: ${config.path ?? "auto"} (${config.source})`);
  }

  return run(args, stdio);
}

function buildArgs(
  params: SingleInputExecuteParams<Options>,
  config: ResolvedConfig,
): string[] {
  const { input, options, passthrough } = params;

  const args = ["bundle", input, "--output", options.output];

  // only pass --config if we resolved an explicit path (cli or bundled)
  if (config.path) args.push("--config", config.path);

  if (options.ext) {
    args.push("--ext", options.ext);
  }

  if (options.dereferenced) {
    args.push("--dereferenced");
  }

  // forward any passthrough args to redocly
  if (passthrough.length > 0) {
    args.push(...passthrough);
  }

  return args;
}
