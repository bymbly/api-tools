import { Command, CommandUnknownOpts } from "@commander-js/extra-typings";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GlobalOptions } from "./program.js";
import {
  getGlobals,
  parsePassthrough,
  ResolvedDocuments,
  resolveStdio,
  StdioMode,
} from "./runtime.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function handleRawPassthrough(
  _option: unknown,
  cmd: Command,
  passthroughFn: (args: string[], stdio: StdioMode) => number,
): void {
  const [, passthrough] = parsePassthrough(process.argv, undefined);

  if (passthrough.length === 0) {
    cmd.help();
  }

  const globals = getGlobals(cmd);
  const stdio = resolveStdio(globals);

  const code = passthroughFn(passthrough, stdio);
  process.exitCode = code;
}

export interface ExecuteParams<T> {
  options: T;
  globals: GlobalOptions;
  passthrough: readonly string[];
}

export interface SingleInputExecuteParams<T> extends ExecuteParams<T> {
  input: string;
}

export interface MultiInputExecuteParams<T> extends ExecuteParams<T> {
  inputs: readonly string[];
}

export type ExecuteSingleInput<T> = (
  params: SingleInputExecuteParams<T>,
) => number;

export type ExecuteMultiInput<T> = (
  params: MultiInputExecuteParams<T>,
) => number;

export type ResolveDocuments<T> = (
  input: string | undefined,
  options: T,
) => ResolvedDocuments;

export interface SingleInputCommand<T> {
  input: string | undefined;
  options: T;
  cmd: CommandUnknownOpts;
  defaultInput?: string;
  execute: ExecuteSingleInput<T>;
}

export interface BatchInputCommand<T> extends SingleInputCommand<T> {
  resolveDocuments: ResolveDocuments<T>;
}

export interface MultiInputCommand<T> {
  inputs: readonly string[];
  options: T;
  cmd: CommandUnknownOpts;
  minInputs: number;
  maxInputs?: number;
  execute: ExecuteMultiInput<T>;
}

export function runSingleInputCommand<T>(run: SingleInputCommand<T>): void {
  const ctx = getSingleInputRunContext(run);

  // fallback to default input if ctx.input is undefined
  // this happens if commander treated first passthrough token as [input]
  let one = ctx.input ?? run.input;

  if (!one && run.defaultInput) {
    try {
      if (fs.existsSync(run.defaultInput)) {
        one = run.defaultInput;
      }
    } catch {
      // ignore, will fall through to error below
    }
  }

  if (!one) {
    console.error(
      `
❌ Error: no input document specified

Provide an input path or run with --help for usage.
`.trim(),
    );
    process.exitCode = 1;
    return;
  }

  processSingleInputs(run, ctx, [one]);
}

export function runBatchInputCommand<T>(run: BatchInputCommand<T>): void {
  const ctx = getSingleInputRunContext(run);

  const resolved = run.resolveDocuments(ctx.input, run.options);

  if (resolved.inputs.length === 0) {
    const checkedList = resolved.checked.map((p) => `  ${p}`).join("\n");
    const scope =
      resolved.requested.length > 0 && resolved.requested[0] !== "explicit"
        ? resolved.requested.join(", ")
        : "specification";

    console.error(
      `
❌ Error: no input documents found

No input was provided, and no default ${scope} files were found in the current directory:

${checkedList}

Provide an input path or create one of the above files and try again.
`.trim(),
    );

    process.exitCode = 1;
    return;
  }

  processSingleInputs(run, ctx, resolved.inputs);
}

export function runMultiInputCommand<T>(run: MultiInputCommand<T>): void {
  const ctx = getMultiInputRunContext(run);

  if (ctx.inputs.length < run.minInputs) {
    console.error(
      `
❌ Error: requires at least ${String(run.minInputs)} input documents

Provide input paths or run with --help for usage.
`.trim(),
    );
    process.exitCode = 1;
    return;
  }

  if (run.maxInputs && ctx.inputs.length > run.maxInputs) {
    console.error(
      `
❌ Error: maximum ${String(run.maxInputs)} inputs allowed

Run with --help for usage.
`.trim(),
    );
    process.exitCode = 1;
    return;
  }

  process.exitCode = run.execute({
    inputs: ctx.inputs,
    options: run.options,
    globals: ctx.globals,
    passthrough: ctx.passthrough,
  });
}

interface RunContext {
  globals: GlobalOptions;
  passthrough: readonly string[];
}

interface SingleInputRunContext extends RunContext {
  input: string | undefined;
}

interface MultiInputRunContext extends RunContext {
  inputs: readonly string[];
}

function getSingleInputRunContext<T>(
  run: SingleInputCommand<T>,
): SingleInputRunContext {
  const globals = getGlobals(run.cmd);
  const [input, passthrough] = parsePassthrough(process.argv, run.input);

  return { globals, input, passthrough };
}

function getMultiInputRunContext<T>(
  run: MultiInputCommand<T>,
): MultiInputRunContext {
  const globals = getGlobals(run.cmd);
  const inputs = run.inputs;
  // for multi-input, we don't need to track individual inputs
  // commander handles the positional args, we just need the passthrough args
  const [, passthrough] = parsePassthrough(process.argv, undefined);

  return { globals, inputs, passthrough };
}

function processSingleInputs<T>(
  run: SingleInputCommand<T>,
  ctx: SingleInputRunContext,
  inputs: readonly string[],
): void {
  const results = inputs.map((docInput) => ({
    input: docInput,
    exitCode: run.execute({
      input: docInput,
      options: run.options,
      globals: ctx.globals,
      passthrough: ctx.passthrough,
    }),
  }));

  process.exitCode = results.some((r) => r.exitCode !== 0) ? 1 : 0;
}

export function createInitCommand(configFilename: string): Command {
  return new Command("init")
    .description(`Create a ${configFilename} in the current directory`)
    .option("-f, --force", "Overwrite existing file", false)
    .action((options: { force: boolean }) => {
      initConfig(configFilename, options.force);
    });
}

function initConfig(configFilename: string, force: boolean): void {
  const bundledPath = path.join(__dirname, "../../defaults/", configFilename);
  const targetPath = path.join(process.cwd(), configFilename);

  if (fs.existsSync(targetPath) && !force) {
    console.error(
      `
❌ Error: ${configFilename} already exists

Use --force to overwrite the existing file.
`.trim(),
    );
    process.exitCode = 1;
    return;
  }

  try {
    fs.copyFileSync(bundledPath, targetPath);
    console.log(`✅ Created ${configFilename}`);
  } catch (error) {
    const message = errorMessage(error);
    console.error(
      `
❌ Error: failed to create ${configFilename}

${message}
`.trim(),
    );
    process.exitCode = 1;
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
