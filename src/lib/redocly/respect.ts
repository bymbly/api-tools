import {
  Command,
  CommandUnknownOpts,
  Option,
} from "@commander-js/extra-typings";
import { ExecuteParams, runSingleDocumentCommand } from "../cli/helpers.js";
import { isQuiet, resolveStdio } from "../cli/runtime.js";
import { run } from "./cli.js";

export interface Options {
  workflow?: string[];
  skip?: string[];
  verbose: boolean;
  server?: string[];
  input?: string[];
  jsonOutput?: string;
  harOutput?: string;
}

export const respectCommand = new Command("respect")
  .description("Execute Arazzo workflow tests using Redocly")
  .argument("[input]", "Arazzo document path (default: arazzo/arazzo.yaml)")

  .addOption(
    new Option(
      "--workflow <names...>",
      "Run only specified workflows",
    ).conflicts("skip"),
  )
  .addOption(
    new Option("--skip <names...>", "Skip specified workflows").conflicts(
      "workflow",
    ),
  )
  .option("--verbose", "Enable verbose output", false)
  .option(
    "--input <params...>",
    "Workflow input parameters (key=value or JSON)",
  )
  .option("--server <overrides...>", "Server overrides (format: name=url)")
  .option("--json-output <file>", "Save results to JSON file")
  .option("--har-output <file>", "Save HTTP interactions to HAR file")
  .allowExcessArguments(true)
  .action(runRespect);

function runRespect(
  input: string | undefined,
  options: Options,
  cmd: CommandUnknownOpts,
): void {
  runSingleDocumentCommand({
    input,
    options,
    cmd,
    defaultInput: "arazzo/arazzo.yaml",
    execute: respect,
  });
}

export function respect(params: ExecuteParams<Options>): number {
  const { input, options, globals } = params;

  const args = buildArgs(params);
  const stdio = resolveStdio(globals);
  const quiet = isQuiet(globals);

  if (!quiet) {
    console.log(`🧪 Redocly respect...`);
    console.log(`   Input: ${input}`);
    if (options.workflow && options.workflow.length > 0) {
      console.log(`   Workflows: ${options.workflow.join(", ")}`);
    }
    if (options.skip && options.skip.length > 0) {
      console.log(`   Skipped Workflows: ${options.skip.join(", ")}`);
    }
    if (options.server && options.server.length > 0) {
      console.log(`   Server Overrides: ${options.server.join(", ")}`);
    }
    if (options.jsonOutput) {
      console.log(`   JSON Output: ${options.jsonOutput}`);
    }
    if (options.harOutput) {
      console.log(`   HAR Output: ${options.harOutput}`);
    }
  }

  return run(args, stdio);
}

function buildArgs(params: ExecuteParams<Options>): string[] {
  const { input, options, passthrough } = params;

  const args = ["respect", input];

  if (options.workflow && options.workflow.length > 0) {
    args.push("--workflow", ...options.workflow);
  }

  if (options.skip && options.skip.length > 0) {
    args.push("--skip", ...options.skip);
  }

  if (options.verbose) {
    args.push("--verbose");
  }

  if (options.input && options.input.length > 0) {
    options.input.forEach((param) => {
      args.push("--input", param);
    });
  }

  if (options.server && options.server.length > 0) {
    args.push("--server", ...options.server);
  }

  if (options.jsonOutput) {
    args.push("--json-output", options.jsonOutput);
  }

  if (options.harOutput) {
    args.push("--har-output", options.harOutput);
  }

  // forward any passthrough args to redocly
  if (passthrough.length > 0) {
    args.push(...passthrough);
  }

  return args;
}
