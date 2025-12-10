import { execSync } from "child_process";
import { createPath } from "./utils.js";

const VALID_FORMATS = ["json", "yaml"] as const;
export type Format = (typeof VALID_FORMATS)[number];

export interface BundleOptions {
  input: string;
  output: string;
  format: Format;
}

function isValidFormat(format: string): format is Format {
  return VALID_FORMATS.includes(format as Format);
}

export function getOptions(): BundleOptions {
  const formatEnv = process.env.OPENAPI_FORMAT;
  const format = formatEnv && isValidFormat(formatEnv) ? formatEnv : "yaml";

  return {
    input: process.env.OPENAPI_INPUT || "openapi/openapi.yaml",
    output: process.env.OPENAPI_OUTPUT || "dist/openapi",
    format,
  };
}

export function bundle(): void {
  const options = getOptions();

  const outputFile = `${options.output}.${options.format}`;

  console.log(`📦 Bundling OpenAPI spec...`);
  console.log(`   Input: ${options.input}`);
  console.log(`   Output: ${options.output}`);
  console.log(`   Format: ${options.format}`);

  createPath(outputFile);

  try {
    execSync(
      `npx --no @redocly/cli bundle ${options.input} --output ${outputFile}`,
      { stdio: "inherit" },
    );

    console.log(`✅ Bundle created successfully: ${outputFile}`);
  } catch (error) {
    console.error(`❌ Bundling failed!`);
    console.error(`${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
