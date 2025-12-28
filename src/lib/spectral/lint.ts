import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createValidator } from "../utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nodeRequire = createRequire(import.meta.url);

const VALID_FORMATS = [
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
export type LintFormat = (typeof VALID_FORMATS)[number];

const VALID_FAIL_SEVERITIES = ["error", "warn", "info", "hint"] as const;
export type FailSeverity = (typeof VALID_FAIL_SEVERITIES)[number];

interface Ruleset {
  path?: string;
  source: "env" | "bundled" | "local";
}

export interface LintOptions {
  input: string;
  format: LintFormat;
  output?: string;
  ruleset: Ruleset;
  failSeverity: FailSeverity;
  displayOnlyFailures: boolean;
  verbose: boolean;
}

const formatValidator = createValidator(VALID_FORMATS);
export const isValidLintFormat = formatValidator.isValid;

const failSeverityValidator = createValidator(VALID_FAIL_SEVERITIES);
export const isValidFailSeverity = failSeverityValidator.isValid;

// https://github.com/stoplightio/spectral/blob/develop/packages/core/src/ruleset/ruleset.ts#L24
const SPECTRAL_RULESET_REGEX = /^\.?spectral\.(ya?ml|json|m?js)$/;

const defaultRulesetPath = path.join(
  __dirname,
  "../../../defaults/spectral.yaml",
);

export function getOptions(): LintOptions {
  const formatEnv = process.env.SPECTRAL_FORMAT;
  const format =
    formatEnv && isValidLintFormat(formatEnv) ? formatEnv : "stylish";

  const failSeverityEnv = process.env.SPECTRAL_FAIL_SEVERITY;
  const failSeverity =
    failSeverityEnv && isValidFailSeverity(failSeverityEnv)
      ? failSeverityEnv
      : "warn"; // be more strict than cli default

  const ruleset = getRuleset();

  return {
    input: process.env.OPENAPI_INPUT || "openapi/openapi.yaml",
    format,
    output: process.env.OPENAPI_OUTPUT,
    ruleset,
    failSeverity,
    displayOnlyFailures: process.env.SPECTRAL_DISPLAY_ONLY_FAILURES === "true",
    verbose: process.env.SPECTRAL_VERBOSE === "true",
  };
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

function getRuleset(): Ruleset {
  const env = process.env.OPENAPI_CONFIG;
  if (env) return { path: env, source: "env" };

  if (hasLocalRuleset()) return { path: undefined, source: "local" };

  return {
    path: defaultRulesetPath,
    source: "bundled",
  };
}

function getArgs(options: LintOptions): string[] {
  const args = [
    "lint",
    options.input,
    "--format",
    options.format,
    "--fail-severity",
    options.failSeverity,
  ];

  if (options.ruleset.path) args.push("--ruleset", options.ruleset.path);
  if (options.output) args.push("--output", options.output);
  if (options.displayOnlyFailures) args.push("--display-only-failures");
  if (options.verbose) args.push("--verbose");

  return args;
}

function runSpectral(args: string[], stdio: "inherit" | "ignore") {
  const spectralBin = nodeRequire.resolve(
    "@stoplight/spectral-cli/dist/index.js",
  );

  const res = spawnSync(process.execPath, [spectralBin, ...args], {
    stdio,
    env: process.env,
  });

  if (res.error) throw res.error;
  return res.status ?? 0;
}

export function lint(): number {
  const options = getOptions();

  console.log(`🔍 Linting OpenAPI spec...`);
  console.log(`   Input: ${options.input}`);
  console.log(`   Format: ${options.format}`);
  console.log(
    `   Config: ${options.ruleset.path ?? "auto"} (${options.ruleset.source})`,
  );
  if (options.output) {
    console.log(`   Output: ${options.output}`);
  }
  console.log(`   Fail Severity: ${options.failSeverity}`);
  console.log(`   Display Only Failures: ${options.displayOnlyFailures}`);
  console.log(`   Verbose: ${options.verbose}`);

  const args = getArgs(options);

  const stdio = process.env.SPECTRAL_STDIO === "silent" ? "ignore" : "inherit";

  return runSpectral(args, stdio);
}
