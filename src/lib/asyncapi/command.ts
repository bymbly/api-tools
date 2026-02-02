import { Command } from "@commander-js/extra-typings";
import { handleRawPassthrough } from "../cli/helpers.js";
import { run } from "./cli.js";

export const asyncapiCommand = new Command("asyncapi")
  .description("AsyncAPI-related commands")
  .allowExcessArguments(true)
  .configureHelp({
    sortSubcommands: true,
    sortOptions: true,
  })
  .action((opts, cmd) => {
    handleRawPassthrough(opts, cmd, run);
  });
