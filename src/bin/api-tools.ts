#!/usr/bin/env node
import { errorMessage } from "../lib/cli/helpers.js";
import { buildProgram } from "../lib/cli/program.js";

buildProgram()
  .parseAsync(process.argv)
  .catch((error: unknown) => {
    process.exitCode = 1;

    const message = errorMessage(error);

    console.error(`❌ Error: ${message}`);
  });
