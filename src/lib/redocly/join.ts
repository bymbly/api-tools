import {
  Command,
  CommandUnknownOpts,
  Option,
} from "@commander-js/extra-typings";
import {
  MultiInputExecuteParams,
  runMultiInputCommand,
} from "../cli/helpers.js";
import { isQuiet, ResolvedConfig, resolveStdio } from "../cli/runtime.js";
import { resolveConfig, run } from "./cli.js";

export interface Options {
  output: string;
  config?: string;
  prefixComponentsWithInfoProp?: string;
  prefixTagsWithInfoProp?: string;
  prefixTagsWithFilename: boolean;
  withoutXTagGroups: boolean;
}

export const joinCommand = new Command("join")
  .description("Join multiple OpenAPI 3.x documents into a single file")
  .argument("<apis...>", "API documents to join (at least 2 required)")

  .option(
    "--output <file>",
    "Output file path (default: dist/join/openapi.yaml)",
    "dist/join/openapi.yaml",
  )
  .option(
    "--prefix-components-with-info-prop <property>",
    "Prefix component names with info property to resolve conflicts (e.g., version, title)",
  )
  .addOption(
    new Option(
      "--prefix-tags-with-info-prop <property>",
      "Prefix tag names with info property (e.g., title, version)",
    ).conflicts(["prefixTagsWithFilename", "withoutXTagGroups"]),
  )
  .addOption(
    new Option(
      "--prefix-tags-with-filename",
      "Prefix tag names with filename to resolve conflicts",
    )
      .default(false)
      .conflicts(["prefixTagsWithInfoProp", "withoutXTagGroups"]),
  )
  .addOption(
    new Option(
      "--without-x-tag-groups",
      "Skip automated x-tagGroups creation (avoids tag duplication)",
    )
      .default(false)
      .conflicts(["prefixTagsWithInfoProp", "prefixTagsWithFilename"]),
  )
  .option("--config <file>", "Config file path (overrides auto/bundled)")
  .allowExcessArguments(true)
  .action(runJoin);

function runJoin(
  apis: string[],
  options: Options,
  cmd: CommandUnknownOpts,
): void {
  runMultiInputCommand({
    inputs: apis,
    options,
    cmd,
    minInputs: 2,
    execute: join,
  });
}

export function join(params: MultiInputExecuteParams<Options>): number {
  const { inputs, options, globals } = params;

  const config = resolveConfig(options.config);
  const args = buildArgs(params, config);
  const stdio = resolveStdio(globals);
  const quiet = isQuiet(globals);

  if (!quiet) {
    console.log(`🔗 Redocly join...`);
    console.log(`   Inputs: ${inputs.join(", ")}`);
    console.log(`   Output: ${options.output}`);
    if (options.prefixComponentsWithInfoProp) {
      console.log(
        `   Prefix Components With Info Prop: ${options.prefixComponentsWithInfoProp}`,
      );
    }
    if (options.prefixTagsWithInfoProp) {
      console.log(
        `   Prefix Tags With Info Prop: ${options.prefixTagsWithInfoProp}`,
      );
    }
    if (options.prefixTagsWithFilename) {
      console.log(`   Prefix Tags With Filename: true`);
    }
    if (options.withoutXTagGroups) {
      console.log(`   Without x-tagGroups: true`);
    }
    console.log(`   Config: ${config.path ?? "auto"} (${config.source})`);
  }

  return run(args, stdio);
}

function buildArgs(
  params: MultiInputExecuteParams<Options>,
  config: ResolvedConfig,
): string[] {
  const { inputs, options, passthrough } = params;

  const args = ["join", ...inputs, "--output", options.output];

  // only pass --config if we resolved an explicit path (cli or bundled)
  if (config.path) args.push("--config", config.path);

  if (options.prefixComponentsWithInfoProp) {
    args.push(
      "--prefix-components-with-info-prop",
      options.prefixComponentsWithInfoProp,
    );
  }

  if (options.prefixTagsWithInfoProp) {
    args.push("--prefix-tags-with-info-prop", options.prefixTagsWithInfoProp);
  }

  if (options.prefixTagsWithFilename) {
    args.push("--prefix-tags-with-filename");
  }

  if (options.withoutXTagGroups) {
    args.push("--without-x-tag-groups");
  }

  // forward any passthrough args to redocly
  if (passthrough.length > 0) {
    args.push(...passthrough);
  }

  return args;
}
