import { Command } from "@commander-js/extra-typings";
import { handleRawPassthrough } from "../cli/helpers.js";
import { buildDocsCommand } from "./build-docs.js";
import { bundleCommand } from "./bundle.js";
import { run } from "./cli.js";
import { formatCommand } from "./format.js";
import { generateCommand } from "./generate/command.js";
import { lintCommand } from "./lint.js";

export const asyncapiCommand = new Command("asyncapi")
  .description("AsyncAPI-related commands")
  .allowExcessArguments(true)
  .configureHelp({
    sortSubcommands: true,
    sortOptions: true,
  })
  .action((opts, cmd) => {
    handleRawPassthrough(opts, cmd, run);
  })
  .addCommand(lintCommand)
  .addCommand(bundleCommand)
  .addCommand(formatCommand)
  .addCommand(generateCommand)
  .addCommand(buildDocsCommand);
