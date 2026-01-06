import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GlobalOptions } from "../cli/program.js";
import { isQuiet, resolveStdio, StdioMode } from "../cli/runtime.js";
import { SpectralLintCliOptions } from "./command.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const nodeRequire = createRequire(import.meta.url);

// https://github.com/stoplightio/spectral/blob/develop/packages/core/src/ruleset/ruleset.ts#L24
const SPECTRAL_RULESET_REGEX = /^\.?spectral\.(ya?ml|json|m?js)$/;

const defaultRulesetPath = path.join(
  __dirname,
  "../../../defaults/spectral.yaml",
);

type RulesetSource = "cli" | "local" | "bundled";
type ResolvedRuleset = {
  path?: string;
  source: RulesetSource;
};

export type SpectralLintRun = {
  input?: string;
  options: SpectralLintCliOptions;
  globals: GlobalOptions;
  passthrough?: string[];
};

export function spectralPassthrough(args: string[], stdio: StdioMode): number {
  return runSpectral(args, stdio);
}

export function lintSpectral(run: SpectralLintRun): number {
  const input = run.input ?? "openapi/openapi.yaml";
  const { options, globals } = run;

  const ruleset = resolveRuleset(options.ruleset);

  const spectralArgs = buildArgs({
    input,
    options,
    ruleset,
    passthrough: run.passthrough ?? [],
  });

  const stdio = resolveStdio(globals);
  const quiet = isQuiet(globals);

  if (!quiet) {
    console.log(`🔍 Spectral lint...`);
    console.log(`   Input: ${input}`);
    console.log(`   Format: ${options.format}`);
    console.log(`   Ruleset: ${ruleset.path ?? "auto"} (${ruleset.source})`);
    if (options.output) {
      console.log(`   Output: ${options.output}`);
    }
    console.log(`   Fail Severity: ${options.failSeverity}`);
    console.log(`   Display Only Failures: ${options.displayOnlyFailures}`);
    console.log(`   Verbose: ${options.verbose}`);
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
  passthrough: string[];
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
