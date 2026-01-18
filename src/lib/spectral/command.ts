import { Command } from "@commander-js/extra-typings";
import { handleRawPassthrough } from "../cli/helpers.js";
import { run } from "./cli.js";
import { lintCommand } from "./lint.js";

export const spectralCommand = new Command("spectral")
  .description("Spectral-related commands")
  .allowExcessArguments(true)
  .action((opts, cmd) => {
    handleRawPassthrough(opts, cmd, run);
  })
  .addCommand(lintCommand);
