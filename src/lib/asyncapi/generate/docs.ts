import { Command, CommandUnknownOpts } from "@commander-js/extra-typings";
import path from "node:path";
import {
  runSingleInputCommand,
  SingleInputExecuteParams,
} from "../../cli/helpers.js";
import { isQuiet } from "../../cli/runtime.js";
import * as FromTemplateCommand from "./from-template.js";

export interface Options {
  output: string;
  params: string[];
  singleFile: boolean;
}

export const docsCommand = new Command("docs")
  .description(
    "Generate HTML documentation from AsyncAPI document (convenience wrapper around from-template with HTML template)",
  )
  .argument(
    "[input]",
    "AsyncAPI document path (default: asyncapi/asyncapi.yaml)",
  )

  .option(
    "--output <file>",
    "Output HTML file path (default: dist/docs/asyncapi.html)",
    "dist/docs/asyncapi.html",
  )
  .option(
    "--params <key=value...>",
    "Additional params to pass to the template",
    (val, prev): string[] => {
      return prev.concat([val]);
    },
    [],
  )
  .option(
    "--single-file",
    "Generate a single HTML file instead of multiple files",
    true,
  )
  .option(
    "--no-single-file",
    "Generate multiple files (overrides --single-file)",
    false,
  )
  .allowExcessArguments(true)
  .action(runDocs);

export function runDocs(
  input: string | undefined,
  options: Options,
  cmd: CommandUnknownOpts,
): void {
  runSingleInputCommand({
    input,
    options,
    cmd,
    defaultInput: "asyncapi/asyncapi.yaml",
    execute: docs,
  });
}

export function docs(params: SingleInputExecuteParams<Options>): number {
  const { input, options, globals } = params;

  const args = buildArgs(params);
  const quiet = isQuiet(globals);

  if (!quiet) {
    console.log(`📚 AsyncAPI generate docs...`);
    console.log(`   Input: ${input}`);
    console.log(
      `   Output: ${options.singleFile ? options.output : args.options.output}`,
    );
    if (args.options.params.length > 0) {
      console.log(`   Params: ${args.options.params.join(", ")}`);
    }
    if (!options.singleFile) {
      console.log(`   Single file: false`);
    }
  }

  globals.quiet = true; // prevent double logging since we're calling a command internally

  return FromTemplateCommand.fromTemplate(args);
}

function buildArgs(
  params: SingleInputExecuteParams<Options>,
): SingleInputExecuteParams<FromTemplateCommand.Options> {
  const { options } = params;

  const parsed = path.parse(options.output);
  let outputDir = parsed.dir || ".";
  const outputFilename = parsed.base;

  const templateParams: string[] = [];
  if (options.singleFile) {
    templateParams.push("singleFile=true");
    templateParams.push(`outFilename=${outputFilename}`);
  } else {
    outputDir = path.join(outputDir, "asyncapi");
  }

  if (options.params.length > 0) {
    templateParams.push(...options.params);
  }

  const args: SingleInputExecuteParams<FromTemplateCommand.Options> = {
    ...params,
    options: {
      template: "@asyncapi/html-template@latest",
      output: outputDir,
      params: templateParams,
      forceWrite: true,
    },
  };
  return args;
}
