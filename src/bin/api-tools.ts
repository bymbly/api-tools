#!/usr/bin/env node
import { buildProgram } from "../lib/cli/program.js";

buildProgram()
  .parseAsync(process.argv)
  .catch((error: unknown) => {
    process.exitCode = 1;

    if (error instanceof Error) {
      console.error(`❌ Error: ${error.message}`);
    } else {
      console.error("❌ Error:", error);
    }
  });
