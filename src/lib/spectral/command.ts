import {
  Command,
  CommandUnknownOpts,
  Option,
} from "@commander-js/extra-typings";
import fs from "node:fs";
import { getGlobals, parsePassthrough, resolveStdio } from "../cli/runtime.js";
import { lintSpectral, spectralPassthrough } from "./lint.js";

const VALID_OUTPUT_FORMATS = [
  "json",
  "stylish",
  "junit",
  "html",
  "text",
  "teamcity",
  "pretty",
  "github-actions",
  "sarif",
  "markdown",
  "gitlab",
] as const;

const VALID_FAIL_SEVERITIES = ["error", "warn", "info", "hint"] as const;

export type OutputFormat = (typeof VALID_OUTPUT_FORMATS)[number];
export type FailSeverity = (typeof VALID_FAIL_SEVERITIES)[number];

export interface SpectralLintCliOptions {
  format: OutputFormat;
  output?: string;
  ruleset?: string;
  failSeverity: FailSeverity;
  displayOnlyFailures: boolean;
  verbose: boolean;
  openapi?: boolean;
  asyncapi?: boolean;
  arazzo?: boolean;
}

interface SpecType {
  flag: keyof Pick<SpectralLintCliOptions, "openapi" | "asyncapi" | "arazzo">;
  defaultPath: string;
  name: string;
}

const SPEC_TYPES: SpecType[] = [
  { flag: "openapi", defaultPath: "openapi/openapi.yaml", name: "OpenAPI" },
  {
    flag: "asyncapi",
    defaultPath: "asyncapi/asyncapi.yaml",
    name: "AsyncAPI",
  },
  { flag: "arazzo", defaultPath: "arazzo/arazzo.yaml", name: "Arazzo" },
];

export const spectralCommand = new Command("spectral")
  .description("Spectral-related commands")
  .allowExcessArguments(true)
  .action(rawSpectral)

  .addCommand(
    new Command("lint")
      .description(
        "Validate and lint OpenAPI v2 & v3.x, AsyncAPI, and Arazzo v1 Documents using Spectral",
      )
      .argument("[input]", "Document path (default: auto-detect)")

      .option(
        "--openapi",
        "Lint OpenAPI document at openapi/openapi.yaml",
        false,
      )
      .option(
        "--asyncapi",
        "Lint AsyncAPI document at asyncapi/asyncapi.yaml",
        false,
      )
      .option("--arazzo", "Lint Arazzo document at arazzo/arazzo.yaml", false)

      .addOption(
        new Option("--format <format>", "Output format")
          .choices([...VALID_OUTPUT_FORMATS])
          .default("stylish" satisfies OutputFormat),
      )
      .option("--output <file>", "Write output to a file")
      .option("--ruleset <file>", "Ruleset file path (overrides auto/bundled)")
      .addOption(
        new Option("--fail-severity <level>", "Fail severity threshold")
          .choices([...VALID_FAIL_SEVERITIES])
          .default("warn" satisfies FailSeverity),
      )
      .option("--display-only-failures", "Display only failing results", false)
      .option("--verbose", "Enable verbose output", false)
      .allowExcessArguments(true)
      .action(runSpectralLint),
  );

function rawSpectral(_options: unknown, cmd: Command): void {
  const [, passthrough] = parsePassthrough(process.argv, undefined);

  if (passthrough.length === 0) {
    cmd.help();
  }

  const globals = getGlobals(cmd);
  const stdio = resolveStdio(globals);

  const code = spectralPassthrough(passthrough, stdio);
  process.exitCode = code;
}

function runSpectralLint(
  input: string | undefined,
  options: SpectralLintCliOptions,
  cmd: CommandUnknownOpts,
): void {
  const globals = getGlobals(cmd);

  let passthrough: string[];
  [input, passthrough] = parsePassthrough(process.argv, input);

  const documentsToLint = determineDocumentsToLint(input, options);

  if (documentsToLint.length === 0) {
    console.error("❌ No documents found to lint");
    process.exitCode = 1;
    return;
  }

  const results: { input: string; exitCode: number }[] = [];

  for (const docInput of documentsToLint) {
    const code = lintSpectral({
      input: docInput,
      options,
      globals,
      passthrough,
    });

    results.push({ input: docInput, exitCode: code });
  }

  const failedDocs = results.filter((r) => r.exitCode !== 0);

  if (failedDocs.length > 0) {
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
}
function determineDocumentsToLint(
  input: string | undefined,
  options: SpectralLintCliOptions,
): string[] {
  // if explicit input provided, only use that
  if (input) return [input];

  const requestedTypes = SPEC_TYPES.filter((type) => options[type.flag]);

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
