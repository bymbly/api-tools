import { Command, CommandUnknownOpts } from "@commander-js/extra-typings";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GlobalOptions } from "./program.js";
import {
  getGlobals,
  parsePassthrough,
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
  input: string;
  options: T;
  globals: GlobalOptions;
  passthrough: readonly string[];
}

export type Execute<T> = (params: ExecuteParams<T>) => number;

export type ResolveInputs<T> = (
  input: string | undefined,
  options: T,
) => string[];

export interface SingleInputRun<T> {
  input: string | undefined;
  options: T;
  cmd: CommandUnknownOpts;
  execute: Execute<T>;
}

export interface MultiInputRun<T> extends SingleInputRun<T> {
  resolveInputs: ResolveInputs<T>;
}

export function runSingleInputCommand<T>(run: SingleInputRun<T>): void {
  const ctx = getRunContext(run);

  // fallback to default input if ctx.input is undefined
  // this happens if commander treated first passthrough token as [input]
  const one = ctx.input ?? run.input;

  if (!one) {
    console.error("❌ No input document specified");
    process.exitCode = 1;
    return;
  }

  processInputs(run, ctx, [one]);
}

export function runMultiInputCommand<T>(run: MultiInputRun<T>): void {
  const ctx = getRunContext(run);

  const documents = run.resolveInputs(ctx.input, run.options);

  if (documents.length === 0) {
    console.error("❌ No input documents found to process");
    process.exitCode = 1;
    return;
  }

  processInputs(run, ctx, documents);
}

interface RunContext {
  globals: GlobalOptions;
  input: string | undefined;
  passthrough: readonly string[];
}

function getRunContext<T>(run: SingleInputRun<T>): RunContext {
  const globals = getGlobals(run.cmd);
  const [input, passthrough] = parsePassthrough(process.argv, run.input);

  return { globals, input, passthrough };
}

function processInputs<T>(
  run: SingleInputRun<T>,
  ctx: RunContext,
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
    console.error(`❌ Failed to create config file:`, error);
    process.exitCode = 1;
  }
}
