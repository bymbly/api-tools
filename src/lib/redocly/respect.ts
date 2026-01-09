import { execSync } from "child_process";

export interface RespectOptions {
  files: string;
  verbose: boolean;
  harOutput?: string;
  jsonOutput?: string;
}

export function getOptions(): RespectOptions {
  return {
    files: process.env.ARAZZO_INPUT ?? "arazzo/*.arazzo.yaml",
    verbose: process.env.ARAZZO_VERBOSE === "true",
    harOutput: process.env.ARAZZO_HAR_OUTPUT,
    jsonOutput: process.env.ARAZZO_JSON_OUTPUT,
  };
}

export function respect(): void {
  const options = getOptions();

  console.log(`🧪 Running Arazzo workflows...`);
  console.log(`   Files: ${options.files}`);

  let command = `npx --no @redocly/cli respect ${options.files}`;

  if (options.verbose) {
    command += ` --verbose`;
  }

  if (options.harOutput) {
    command += ` --har-output ${options.harOutput}`;
    console.log(`   HAR Output: ${options.harOutput}`);
  }

  if (options.jsonOutput) {
    command += ` --json-output ${options.jsonOutput}`;
    console.log(`   JSON Output: ${options.jsonOutput}`);
  }

  try {
    execSync(command, { stdio: "inherit" });
    console.log(`✅ Arazzo workflows executed successfully.`);
  } catch (error) {
    console.error(`❌ Arazzo workflows failed!`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
