import { Command } from "@commander-js/extra-typings";
import { createInitCommand, handleRawPassthrough } from "../cli/helpers.js";
import { buildDocsCommand } from "./build-docs.js";
import { bundleCommand } from "./bundle.js";
import { run } from "./cli.js";
import { generateArazzoCommand } from "./generate-arazzo.js";
import { lintCommand } from "./lint.js";
import { respectCommand } from "./respect.js";

export const redoclyCommand = new Command("redocly")
  .description("Redocly-related commands")
  .allowExcessArguments(true)
  .configureHelp({
    sortSubcommands: true,
    sortOptions: true,
  })
  .action((opts, cmd) => {
    handleRawPassthrough(opts, cmd, run);
  })
  .addCommand(createInitCommand("redocly.yaml"))
  .addCommand(lintCommand)
  .addCommand(buildDocsCommand)
  .addCommand(bundleCommand)
  .addCommand(generateArazzoCommand)
  .addCommand(respectCommand);
