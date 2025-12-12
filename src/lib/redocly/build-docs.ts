import { execSync } from "child_process";
import { createPath } from "../utils.js";

export interface BuildDocsOptions {
  input: string;
  output: string;
  configPath?: string;
}

export function getOptions(): BuildDocsOptions {
  return {
    input: process.env.OPENAPI_INPUT || "openapi/openapi.yaml",
    output: process.env.OPENAPI_OUTPUT || "dist/openapi.html",
    configPath: process.env.OPENAPI_CONFIG,
  };
}

export function buildDocs(): void {
  const options = getOptions();

  console.log(`📚 Building documentation...`);
  console.log(`   Input: ${options.input}`);
  console.log(`   Output: ${options.output}`);
  console.log(`   Config: ${options.configPath || "default"}`);

  let command = `npx --no @redocly/cli build-docs ${options.input} --output ${options.output}`;
  if (options.configPath) {
    command += ` --config ${options.configPath}`;
  }

  createPath(options.output);

  try {
    execSync(command, { stdio: "inherit" });

    console.log(`✅ Documentation built successfully: ${options.output}`);
  } catch (error) {
    console.error(`❌ Building documentation failed!`);
    console.error(`${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
