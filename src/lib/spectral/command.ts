import { Command } from "@commander-js/extra-typings";
import { createInitCommand, handleRawPassthrough } from "../cli/helpers.js";
import { run } from "./cli.js";
import { lintCommand } from "./lint.js";

export const spectralCommand = new Command("spectral")
  .description("Spectral-related commands")
  .allowExcessArguments(true)
  .configureHelp({
    sortSubcommands: true,
    sortOptions: true,
  })
  .action((opts, cmd) => {
    handleRawPassthrough(opts, cmd, run);
  })
  .addCommand(createInitCommand("spectral.yaml"))
  .addCommand(lintCommand);
