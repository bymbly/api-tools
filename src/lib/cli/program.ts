import { Command } from "@commander-js/extra-typings";
import { spectralCommand } from "../spectral/command.js";

export interface GlobalOptions {
  quiet?: boolean;
  silent?: boolean;
  cwd?: string;
}

export function buildProgram() {
  return new Command()
    .name("api-tools")
    .description("Unified API tooling")
    .option(
      "--quiet",
      "Disable wrapper logging (still shows underlying CLI output)",
    )
    .option("--silent", "Disable wrapper logging and underlying CLI output")
    .option("--cwd <path>", "Run as if started in this directory")

    .hook("preAction", (thisCommand) => {
      const opts = thisCommand.opts();
      if (opts.cwd) process.chdir(opts.cwd);
    })
    .addCommand(spectralCommand);
}
