#!/usr/bin/env node
import { buildProgram } from "../lib/cli/program.js";

buildProgram().parseAsync(process.argv);
