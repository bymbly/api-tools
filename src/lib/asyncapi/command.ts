import { Command } from "@commander-js/extra-typings";
import { handleRawPassthrough } from "../cli/helpers.js";
import { bundleCommand } from "./bundle.js";
import { run } from "./cli.js";
import { formatCommand } from "./format.js";
import { generateCommand } from "./generate/command.js";
import { validateCommand } from "./validate.js";

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
  .addCommand(validateCommand)
  .addCommand(bundleCommand)
  .addCommand(formatCommand)
  .addCommand(generateCommand);
