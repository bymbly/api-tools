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

export interface ResolvedDocuments {
  inputs: string[];
  checked: string[];
  requested: string[];
}

export function resolveDocuments(
  input: string | undefined,
  options: DocTypeOptions,
): ResolvedDocuments {
  // if explicit input provided, only use that
  if (input) {
    return { inputs: [input], checked: [input], requested: ["explicit"] };
  }

  const requestedTypes = SPEC_TYPES.filter(
    (type) => options[type.flag as keyof DocTypeOptions],
  );

  const typesToCheck = requestedTypes.length > 0 ? requestedTypes : SPEC_TYPES;

  const checked = typesToCheck.map((t) => t.defaultPath);
  const requested = typesToCheck.map((t) => t.name);

  const inputs = typesToCheck
    .filter((type) => {
      try {
        return fs.existsSync(type.defaultPath);
      } catch {
        return false;
      }
    })
    .map((type) => type.defaultPath);

  return { inputs, checked, requested };
}

export type ConfigSource = "cli" | "local" | "bundled";

export interface ResolvedConfig {
  path?: string;
  source: ConfigSource;
}

export function hasLocalConfig(pattern: RegExp): boolean {
  try {
    return fs
      .readdirSync(process.cwd(), { withFileTypes: true })
      .some((f) => f.isFile() && pattern.test(f.name));
  } catch {
    return false;
  }
}

export function resolveConfig(
  cliConfig: string | undefined,
  localPattern: RegExp,
  defaultPath: string,
): ResolvedConfig {
  if (cliConfig) return { path: cliConfig, source: "cli" };
  if (hasLocalConfig(localPattern)) return { path: undefined, source: "local" };
  return { path: defaultPath, source: "bundled" };
}
