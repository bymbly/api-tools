import { Command } from "@commander-js/extra-typings";
import { createInitCommand, handleRawPassthrough } from "../cli/helpers.js";
import { buildDocsCommand } from "./build-docs.js";
import { run } from "./cli.js";
import { lintCommand } from "./lint.js";

export const redoclyCommand = new Command("redocly")
  .description("Redocly-related commands")
  .allowExcessArguments(true)
  .action((opts, cmd) => {
    handleRawPassthrough(opts, cmd, run);
  })
  .addCommand(createInitCommand("redocly.yaml"))
  .addCommand(lintCommand)
  .addCommand(buildDocsCommand);
