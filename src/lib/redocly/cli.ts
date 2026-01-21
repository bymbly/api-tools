import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  resolveConfigRuntime,
  ResolvedConfig,
  runCli,
  StdioMode,
} from "../cli/runtime.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const BIN_PATH = "@redocly/cli/bin/cli.js";

const CONFIG_REGEX = /^\.?redocly\.ya?ml$/;
const DEFAULT_CONFIG_PATH = path.join(__dirname, "../../defaults/redocly.yaml");

export function resolveConfig(cliConfig: string | undefined): ResolvedConfig {
  return resolveConfigRuntime(cliConfig, CONFIG_REGEX, DEFAULT_CONFIG_PATH);
}

export function run(args: string[], stdio: StdioMode): number {
  return runCli(BIN_PATH, args, stdio);
}
