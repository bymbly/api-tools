#!/usr/bin/env node
import { buildProgram } from "../lib/cli/program.js";

buildProgram()
  .parseAsync(process.argv)
  .catch((error: unknown) => {
    process.exitCode = 1;

    const message = error instanceof Error ? error.message : String(error);

    console.error(`❌ Error: ${message}`);
  });
