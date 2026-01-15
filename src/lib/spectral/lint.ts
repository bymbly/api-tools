import {
  Command,
  CommandUnknownOpts,
  Option,
} from "@commander-js/extra-typings";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ExecuteParams, runMultiInputCommand } from "../cli/helpers.js";
import {
  DocTypeOptions,
  isQuiet,
  resolveDocuments,
  resolveStdio,
  StdioMode,
} from "../cli/runtime.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const nodeRequire = createRequire(import.meta.url);

// https://github.com/stoplightio/spectral/blob/develop/packages/core/src/ruleset/ruleset.ts#L24
const SPECTRAL_RULESET_REGEX = /^\.?spectral\.(ya?ml|json|m?js)$/;

const defaultRulesetPath = path.join(__dirname, "../../defaults/spectral.yaml");

export const VALID_OUTPUT_FORMATS = [
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

export const VALID_FAIL_SEVERITIES = ["error", "warn", "info", "hint"] as const;

export type OutputFormat = (typeof VALID_OUTPUT_FORMATS)[number];
export type FailSeverity = (typeof VALID_FAIL_SEVERITIES)[number];

export interface SpectralLintCliOptions extends DocTypeOptions {
  format: OutputFormat;
  output?: string;
  ruleset?: string;
  failSeverity: FailSeverity;
  displayOnlyFailures: boolean;
  verbose: boolean;
}

type RulesetSource = "cli" | "local" | "bundled";
interface ResolvedRuleset {
  path?: string;
  source: RulesetSource;
}

export const lintCommand = new Command("lint")
  .description(
    "Validate and lint OpenAPI, AsyncAPI, and Arazzo Documents using Spectral",
  )
  .argument("[input]", "Document path (default: auto-detect)")

  .option("--openapi", "Lint OpenAPI document at openapi/openapi.yaml", false)
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
  .action(runSpectralLint);

function runSpectralLint(
  input: string | undefined,
  options: SpectralLintCliOptions,
  cmd: CommandUnknownOpts,
): void {
  runMultiInputCommand({
    input,
    options,
    cmd,
    resolveInputs: resolveDocuments,
    execute: lintSpectral,
  });
}

export function spectralPassthrough(args: string[], stdio: StdioMode): number {
  return runSpectral(args, stdio);
}

export function lintSpectral(
  run: ExecuteParams<SpectralLintCliOptions>,
): number {
  const { options, globals } = run;

  const ruleset = resolveRuleset(options.ruleset);

  const spectralArgs = buildArgs({
    input: run.input,
    options,
    ruleset,
    passthrough: run.passthrough ?? [],
  });

  const stdio = resolveStdio(globals);
  const quiet = isQuiet(globals);

  if (!quiet) {
    console.log(`🔍 Spectral lint...`);
    console.log(`   Input: ${run.input}`);
    console.log(`   Format: ${options.format}`);
    console.log(`   Ruleset: ${ruleset.path ?? "auto"} (${ruleset.source})`);
    if (options.output) {
      console.log(`   Output: ${options.output}`);
    }
    console.log(`   Fail Severity: ${options.failSeverity}`);
    console.log(
      `   Display Only Failures: ${String(options.displayOnlyFailures)}`,
    );
    console.log(`   Verbose: ${String(options.verbose)}`);
  }

  return runSpectral(spectralArgs, stdio);
}

function hasLocalRuleset(): boolean {
  try {
    return fs
      .readdirSync(process.cwd(), { withFileTypes: true })
      .some((f) => f.isFile() && SPECTRAL_RULESET_REGEX.test(f.name));
  } catch {
    return false;
  }
}

function resolveRuleset(cliRuleset: string | undefined): ResolvedRuleset {
  if (cliRuleset) return { path: cliRuleset, source: "cli" };
  if (hasLocalRuleset()) return { path: undefined, source: "local" };
  return { path: defaultRulesetPath, source: "bundled" };
}

function buildArgs(params: {
  input: string;
  options: SpectralLintCliOptions;
  ruleset: ResolvedRuleset;
  passthrough: readonly string[];
}): string[] {
  const { input, options, ruleset, passthrough } = params;

  const args = [
    "lint",
    input,
    "--format",
    options.format,
    "--fail-severity",
    options.failSeverity,
  ];

  // only pass --ruleset if we resolved an explicit path (cli or bundled)
  if (ruleset.path) args.push("--ruleset", ruleset.path);

  if (options.output) args.push("--output", options.output);
  if (options.displayOnlyFailures) args.push("--display-only-failures");
  if (options.verbose) args.push("--verbose");

  // forward any passthrough args to spectral
  if (passthrough.length > 0) {
    args.push(...passthrough);
  }

  return args;
}

function runSpectral(args: string[], stdio: StdioMode): number {
  const spectralBin = nodeRequire.resolve(
    "@stoplight/spectral-cli/dist/index.js",
  );

  const res = spawnSync(process.execPath, [spectralBin, ...args], { stdio });

  if (res.error) throw res.error;
  return res.status ?? 0;
}
