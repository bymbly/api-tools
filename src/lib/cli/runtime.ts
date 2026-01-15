import { CommandUnknownOpts } from "@commander-js/extra-typings";
import fs from "node:fs";
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

export interface DocTypeOptions {
  openapi?: boolean;
  asyncapi?: boolean;
  arazzo?: boolean;
}

export interface DocType {
  flag: string;
  defaultPath: string;
  name: string;
}

export const SPEC_TYPES: DocType[] = [
  { flag: "openapi", defaultPath: "openapi/openapi.yaml", name: "OpenAPI" },
  {
    flag: "asyncapi",
    defaultPath: "asyncapi/asyncapi.yaml",
    name: "AsyncAPI",
  },
  { flag: "arazzo", defaultPath: "arazzo/arazzo.yaml", name: "Arazzo" },
];

export interface ResolverParams {
  input: string | undefined;
  options: DocTypeOptions;
}

export function resolveDocuments(params: ResolverParams): string[] {
  // if explicit input provided, only use that
  if (params.input) return [params.input];

  const requestedTypes = SPEC_TYPES.filter(
    (type) => params.options[type.flag as keyof DocTypeOptions],
  );

  const typesToCheck = requestedTypes.length > 0 ? requestedTypes : SPEC_TYPES;

  return typesToCheck
    .filter((type) => {
      try {
        return fs.existsSync(type.defaultPath);
      } catch {
        return false;
      }
    })
    .map((type) => type.defaultPath);
}
