import { Command, CommandUnknownOpts } from "@commander-js/extra-typings";
import {
  runSingleInputCommand,
  SingleInputExecuteParams,
} from "../../cli/helpers.js";
import { isQuiet, resolveStdio } from "../../cli/runtime.js";
import { run } from "../cli.js";

interface CommandOptions {
  output: string;
  params: string[];
  forceWrite: boolean;
}

export interface Options extends CommandOptions {
  template: string;
}

export const fromTemplateCommand = new Command("from-template")
  .description(
    "Generates code or documentation from AsyncAPI documents using a template",
  )
  .argument(
    "<template>",
    "Template name or URL (e.g., @asyncapi/html-template or https://github.com/asyncapi/html-template)",
  )
  .argument("[input]", "Document path (default: asyncapi/asyncapi.yaml)")

  .option(
    "--output <file>",
    "Output file or directory path (default: dist/generated/)",
    "dist/generated/",
  )
  .option(
    "--params <key=value...>",
    "Template parameter (can be used multiple times)",
    (val, prev): string[] => {
      return prev.concat([val]);
    },
    [],
  )
  .option("--force-write", "Overwrite existing files", false)
  .allowExcessArguments(true)
  .action(runFromTemplate);

function runFromTemplate(
  template: string,
  input: string | undefined,
  options: CommandOptions,
  cmd: CommandUnknownOpts,
): void {
  runSingleInputCommand({
    input,
    options: { ...options, template },
    cmd,
    defaultInput: "asyncapi/asyncapi.yaml",
    execute: fromTemplate,
  });
}

export function fromTemplate(
  params: SingleInputExecuteParams<Options>,
): number {
  const { input, options, globals } = params;

  const args = buildArgs(params);
  const stdio = resolveStdio(globals);
  const quiet = isQuiet(globals);

  // prevent using passthrough args without input file
  // commander gets confused since we have two args, causing commander to think
  // the passthrough args are the input file
  if (process.argv.indexOf("--") > 0 && input.includes("--")) {
    console.error(
      `
❌ Error: Cannot use passthrough arguments without specifying an input file

Please provide an input file when using passthrough arguments.
`.trim(),
    );
    return 1;
  }

  if (!quiet) {
    console.log(`🔄 AsyncAPI generate fromTemplate...`);
    console.log(`   Template: ${options.template}`);
    console.log(`   Input: ${input}`);
    console.log(`   Output: ${options.output}`);
  }

  return run(args, stdio);
}

function buildArgs(params: SingleInputExecuteParams<Options>) {
  const { input, options, passthrough } = params;

  const args = [
    "generate",
    "fromTemplate",
    input,
    options.template,
    "--output",
    options.output,
    "--install",
    "--no-interactive",
  ];

  if (options.forceWrite) {
    args.push("--force-write");
  }

  if (options.params.length > 0) {
    args.push("--param", ...options.params);
  }

  // forward any passthrough args
  if (passthrough.length > 0) {
    args.push(...passthrough);
  }

  return args;
}
