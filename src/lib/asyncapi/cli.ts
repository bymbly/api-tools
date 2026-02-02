import path from "node:path";
import { fileURLToPath } from "node:url";
import { runCli, StdioMode } from "../cli/runtime.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const BIN_PATH = "@asyncapi/cli/bin/run_bin";

export function run(args: string[], stdio: StdioMode): number {
  const originalEnv = { ...process.env };

  // use bundled analytics config with telemetry disabled
  process.env.ASYNCAPI_METRICS_CONFIG_PATH = path.join(
    __dirname,
    "../../defaults/.asyncapi-analytics",
  );

  // satisfy `node-config` requirement for a config directory to prevent warnings
  process.env.NODE_CONFIG_DIR = path.join(
    __dirname,
    "../../defaults/node-config",
  );

  // suppress `node-config` warnings about missing/empty configuration
  process.env.SUPPRESS_NO_CONFIG_WARNING = "true";

  try {
    return runCli(BIN_PATH, args, stdio);
  } finally {
    process.env = originalEnv;
  }
}
