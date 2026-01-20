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
  input: string;
  options: T;
  globals: GlobalOptions;
  passthrough: readonly string[];
}

export type Execute<T> = (params: ExecuteParams<T>) => number;

export type ResolveDocuments<T> = (
  input: string | undefined,
  options: T,
) => ResolvedDocuments;

export interface SingleDocumentRun<T> {
  input: string | undefined;
  options: T;
  cmd: CommandUnknownOpts;
  defaultInput?: string;
  execute: Execute<T>;
}

export interface MultiDocumentRun<T> extends SingleDocumentRun<T> {
  resolveDocuments: ResolveDocuments<T>;
}

export function runSingleDocumentCommand<T>(run: SingleDocumentRun<T>): void {
  const ctx = getRunContext(run);

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

  processInputs(run, ctx, [one]);
}

export function runMultiDocumentCommand<T>(run: MultiDocumentRun<T>): void {
  const ctx = getRunContext(run);

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

  processInputs(run, ctx, resolved.inputs);
}

interface RunContext {
  globals: GlobalOptions;
  input: string | undefined;
  passthrough: readonly string[];
}

function getRunContext<T>(run: SingleDocumentRun<T>): RunContext {
  const globals = getGlobals(run.cmd);
  const [input, passthrough] = parsePassthrough(process.argv, run.input);

  return { globals, input, passthrough };
}

function processInputs<T>(
  run: SingleDocumentRun<T>,
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
