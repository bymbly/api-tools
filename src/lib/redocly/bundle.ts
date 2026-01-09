import { execSync } from "child_process";
import { createPath, createValidator } from "../utils.js";

const VALID_FORMATS = ["json", "yaml"] as const;
export type Format = (typeof VALID_FORMATS)[number];

export interface BundleOptions {
  input: string;
  output: string;
  format: Format;
  configPath?: string;
}

const formatValidator = createValidator(VALID_FORMATS);
export const isValidFormat = formatValidator.isValid;

export function getOptions(): BundleOptions {
  const formatEnv = process.env.OPENAPI_FORMAT;
  const format = formatEnv && isValidFormat(formatEnv) ? formatEnv : "yaml";

  return {
    input: process.env.OPENAPI_INPUT ?? "openapi/openapi.yaml",
    output: process.env.OPENAPI_OUTPUT ?? "dist/openapi",
    format,
    configPath: process.env.OPENAPI_CONFIG,
  };
}

export function bundle(): void {
  const options = getOptions();

  const outputFile = `${options.output}.${options.format}`;

  console.log(`📦 Bundling OpenAPI spec...`);
  console.log(`   Input: ${options.input}`);
  console.log(`   Output: ${options.output}`);
  console.log(`   Format: ${options.format}`);
  console.log(`   Config: ${options.configPath ?? "default"}`);

  createPath(outputFile);

  let command = `npx --no @redocly/cli bundle ${options.input} --output ${outputFile}`;
  if (options.configPath) {
    command += ` --config ${options.configPath}`;
  }

  try {
    execSync(command, { stdio: "inherit" });

    console.log(`✅ Bundle created successfully: ${outputFile}`);
  } catch (error) {
    console.error(`❌ Bundling failed!`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
