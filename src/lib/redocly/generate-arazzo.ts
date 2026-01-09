import { execSync } from "child_process";
import { createPath } from "../utils.js";

export interface GenerateArazzoOptions {
  input: string;
  output: string;
}

export function getOptions(): GenerateArazzoOptions {
  return {
    input: process.env.OPENAPI_INPUT ?? "openapi/openapi.yaml",
    output: process.env.OPENAPI_OUTPUT ?? "dist/auto-generated.arazzo.yaml",
  };
}

export function generateArazzo(): void {
  const options = getOptions();

  console.log(`🔄 Generating Arazzo workflows...`);
  console.log(`   Input: ${options.input}`);
  console.log(`   Output: ${options.output}`);

  createPath(options.output);

  const command = `npx --no @redocly/cli generate-arazzo ${options.input} --output-file ${options.output}`;

  try {
    execSync(command, { stdio: "inherit" });
    console.log(
      `✅ Arazzo workflows generated successfully: ${options.output}`,
    );
  } catch (error) {
    console.error(`❌ Arazzo generation failed!`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
