import { CommandUnknownOpts } from "@commander-js/extra-typings";
import { GlobalOptions } from "./program.js";

export type StdioMode = "inherit" | "ignore";

export function resolveStdio(globals: GlobalOptions): StdioMode {
  return globals.silent ? "ignore" : "inherit";
}

export function isQuiet(globals: GlobalOptions): boolean {
  return globals.quiet === true || globals.silent === true;
}

export function parsePassthrough(
  argv: readonly string[],
  input: string | undefined,
): readonly [input: string | undefined, passthrough: string[]] {
  const i = argv.indexOf("--");
  if (i < 0) return [input, []];

  const passthrough = argv.slice(i + 1);

  // if commander treated first passthrough token as [input], put it back
  if (
    input !== undefined &&
    passthrough.length > 0 &&
    input === passthrough[0]
  ) {
    return [undefined, passthrough];
  }

  return [input, passthrough];
}

export function getGlobals(cmd: CommandUnknownOpts): GlobalOptions {
  return cmd.optsWithGlobals() as GlobalOptions;
}
