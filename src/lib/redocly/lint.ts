import { execSync } from "child_process";
import { createValidator } from "../utils.js";

const VALID_FORMATS = [
  "codeframe",
  "stylish",
  "json",
  "checkstyle",
  "codeclimate",
  "github-actions",
  "markdown",
  "summary",
] as const;
export type LintFormat = (typeof VALID_FORMATS)[number];

export interface LintOptions {
  input: string;
  format: LintFormat;
  configPath?: string;
}

const lintFormatValidator = createValidator(VALID_FORMATS);
export const isValidLintFormat = lintFormatValidator.isValid;

export function getOptions(): LintOptions {
  const formatEnv = process.env.OPENAPI_FORMAT;
  const format =
    formatEnv && isValidLintFormat(formatEnv) ? formatEnv : "codeframe";

  return {
    input: process.env.OPENAPI_INPUT || "openapi/openapi.yaml",
    format,
    configPath: process.env.OPENAPI_CONFIG,
  };
}

export function lint(): void {
  const options = getOptions();

  console.log(`🔍 Linting OpenAPI spec...`);
  console.log(`   Input: ${options.input}`);
  console.log(`   Format: ${options.format}`);
  console.log(`   Config: ${options.configPath || "default"}`);

  let command = `npx --no @redocly/cli lint ${options.input} --format ${options.format}`;
  if (options.configPath) {
    command += ` --config ${options.configPath}`;
  }

  try {
    execSync(command, { stdio: "inherit" });

    console.log(`✅ Linting completed successfully.`);
  } catch (error) {
    console.error(`❌ Linting failed!`);
    console.error(`${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
