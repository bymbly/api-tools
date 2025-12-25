import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { createValidator } from "../utils";

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

function getRuleset(): Ruleset {
  const env = process.env.OPENAPI_CONFIG;
  if (env) return { path: env, source: "env" };

  const hasLocal = fs
    .readdirSync(".")
    .some((f) => SPECTRAL_RULESET_REGEX.test(f));
  if (hasLocal) return { path: undefined, source: "local" };

  return {
    path: path.join(__dirname, "../../../defaults/spectral.yaml"),
    source: "bundled",
  };
}

function getCommand(options: LintOptions): string {
  let command = `npx --no @stoplight/spectral-cli lint ${options.input} --format ${options.format} --fail-severity ${options.failSeverity}`;

  if (options.ruleset.path) {
    command += ` --ruleset ${options.ruleset.path}`;
  }

  if (options.output) {
    command += ` --output ${options.output}`;
  }

  if (options.displayOnlyFailures) {
    command += ` --display-only-failures`;
  }

  if (options.verbose) {
    command += ` --verbose`;
  }

  return command;
}

export function lint() {
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
  console.log(
    `   Display Only Failures: ${options.displayOnlyFailures ? "true" : "false"}`,
  );
  console.log(`   Verbose: ${options.verbose ? "true" : "false"}`);

  const command = getCommand(options);

  const stdio = process.env.SPECTRAL_STDIO === "silent" ? "ignore" : "inherit";

  try {
    execSync(command, { stdio });

    console.log(`✅ Linting completed successfully.`);
  } catch (error) {
    console.error(`❌ Linting failed.`);
    console.error(`${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
