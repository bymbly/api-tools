# @bymbly/api-tools

Unified, opinionated CLI wrapper for API specification tooling.

Standardizes common workflows across projects with sensible defaults while allowing full
customization through CLI options and passthrough arguments.

**Supports:** OpenAPI, AsyncAPI, Arazzo

**Wraps:** [AsyncAPI](https://www.asyncapi.com/en/tools/cli) | [Redocly](https://github.com/Redocly/redocly-cli) | [Spectral](https://github.com/stoplightio/spectral)

[![CI](https://github.com/bymbly/api-tools/actions/workflows/workflow.yaml/badge.svg)](https://github.com/bymbly/api-tools/actions/workflows/workflow.yaml)
[![NPM Version](https://img.shields.io/npm/v/@bymbly/api-tools)](https://www.npmjs.com/package/@bymbly/api-tools)
[![NPM License](https://img.shields.io/npm/l/@bymbly/api-tools)](https://github.com/bymbly/api-tools/blob/main/LICENSE)

## Features

- **Single unified CLI** - One tool for all API spec operations
- **Opinionated defaults** - Sensible conventions for file locations and configurations
- **Consistent interface** - Same flags and patterns across all commands
- **Flexible overrides** - CLI options for common cases, passthrough for advanced use
- **Bundled configs** - Default Spectral and Redocly configuration included
- **Auto-detection** - Finds OpenAPI, AsyncAPI, and Arazzo specs automatically

## Table of Contents

- [@bymbly/api-tools](#bymblyapi-tools)
  - [Features](#features)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
  - [Command Structure](#command-structure)
    - [Global Options](#global-options)
  - [Commands](#commands)
    - [AsyncAPI Commands](#asyncapi-commands)
      - [`asyncapi build-docs`](#asyncapi-build-docs)
      - [`asyncapi bundle`](#asyncapi-bundle)
      - [`asyncapi format`](#asyncapi-format)
      - [`asyncapi generate docs`](#asyncapi-generate-docs)
      - [`asyncapi generate from-template`](#asyncapi-generate-from-template)
      - [`asyncapi lint`](#asyncapi-lint)
    - [Redocly Commands](#redocly-commands)
      - [`redocly build-docs`](#redocly-build-docs)
      - [`redocly bundle`](#redocly-bundle)
      - [`redocly generate-arazzo`](#redocly-generate-arazzo)
      - [`redocly init`](#redocly-init)
      - [`redocly join`](#redocly-join)
      - [`redocly lint`](#redocly-lint)
      - [`redocly respect`](#redocly-respect)
    - [Spectral Commands](#spectral-commands)
      - [`spectral init`](#spectral-init)
      - [`spectral lint`](#spectral-lint)
  - [Default File Locations](#default-file-locations)
  - [Configuration Files](#configuration-files)
    - [Auto-Discovery](#auto-discovery)
    - [Bundled Defaults](#bundled-defaults)
    - [Custom Configs](#custom-configs)
  - [Passthrough Arguments](#passthrough-arguments)
  - [CI/CD Integration](#cicd-integration)
    - [GitHub Actions Example](#github-actions-example)
  - [Common Workflows](#common-workflows)
    - [Development](#development)
    - [Pre-commit](#pre-commit)
    - [CI Pipeline](#ci-pipeline)
    - [API Testing](#api-testing)
  - [Troubleshooting](#troubleshooting)
    - [Command not found](#command-not-found)
    - [Config not found](#config-not-found)
    - [Bundled config issues](#bundled-config-issues)
  - [Contributing](#contributing)
  - [License](#license)

## Installation

```bash
npm install -D @bymbly/api-tools@latest
```

## Quick Start

Add scripts to your `package.json`:

```json
{
  "scripts": {
    "lint": "npm run lint:spectral && npm run lint:redocly && npm run lint:asyncapi",
    "lint:spectral": "api-tools spectral lint",
    "lint:redocly": "api-tools redocly lint",
    "lint:asyncapi": "api-tools asyncapi lint",
    "bundle:openapi": "api-tools redocly bundle",
    "bundle:asyncapi": "api-tools asyncapi bundle",
    "join": "api-tools redocly join",
    "docs:openapi": "api-tools redocly build-docs",
    "docs:asyncapi": "api-tools asyncapi build-docs",
    "arazzo:gen": "api-tools redocly generate-arazzo",
    "test:api": "api-tools redocly respect"
  }
}
```

Run:

```bash
npm run lint              # Lint with both Spectral and Redocly
npm run bundle:openapi    # Bundle OpenAPI documents
npm run bundle:asyncapi   # Bundle AsyncAPI documents
npm run join              # Join OpenAPI documents
npm run docs:openapi      # Generate OpenAPI HTML documentation
npm run docs:asyncapi     # Generate AsyncAPI HTML documentation
npm run arazzo:gen        # Generate Arazzo workflow starter
npm run test:api          # Execute Arazzo workflow tests
```

## Command Structure

```bash
api-tools [global-options] <command> <subcommand> [options] [-- passthrough-args]
```

### Global Options

Available for all commands:

- `--quiet` - Disable wrapper logging (still shows tool output)
- `--silent` - Disable all output (wrapper + tool)
- `--cwd <path>` - Run as if started in this directory

## Commands

### AsyncAPI Commands

#### `asyncapi build-docs`

Alias for `asyncapi generate docs` - builds HTML documentation from AsyncAPI documents.

```bash
api-tools asyncapi build-docs [input] [options]
```

See [`asyncapi generate docs`](#asyncapi-generate-docs) for full usage details.

#### `asyncapi bundle`

Bundle AsyncAPI documents into a single file.

**Usage:**

```bash
api-tools asyncapi bundle [input] [options]
```

**Options:**

- `[input]` - Document path (default: `asyncapi/asyncapi.yaml`)
- `--output <path>` - Output file path (default: `dist/bundle/asyncapi.yaml`)
- `--ext <extension>` - Output extension (overrides `--output` extension)
  - Choices: `json`, `yaml`, `yml`
- `--x-origin` - Generate x-origin fields with dereferenced $ref history

**Examples:**

```bash
# Bundle with defaults
api-tools asyncapi bundle

# Bundle to JSON
api-tools asyncapi bundle --ext json

# Bundle with x-origin tracking
api-tools asyncapi bundle --x-origin

# Custom output
api-tools asyncapi bundle --output dist/api-bundle.yaml
```

#### `asyncapi format`

Convert AsyncAPI documents between formats (YAML <---> JSON).

**Usage:**

```bash
api-tools asyncapi format [input] [options]
```

**Options:**

- `[input]` - Document path (default: `asyncapi/asyncapi.yaml`)
- `--output <file>` - Output file path (default: `dist/format/asyncapi.json`)
- `--ext <extension>` - Output extension (overrides `--output` extension)
  - Choices: `json`, `yaml`, `yml`

**Examples:**

```bash
# Convert to JSON (default)
api-tools asyncapi format

# Convert to YAML
api-tools asyncapi format --ext yaml

# Custom input and output
api-tools asyncapi format input.json --output output.yaml
```

#### `asyncapi generate docs`

Generate HTML documentation (convenience wrapper around [`from-template`](#asyncapi-generate-from-template) with HTML template).

**Usage:**

```bash
api-tools asyncapi generate docs [input] [options]
```

**Options:**

- `[input]` - Document path (default: `asyncapi/asyncapi.yaml`)
- `--output <file>` - Output HTML file (default: `dist/docs/asyncapi.html`)
- `--params <key=value...>` - Template parameters (can be repeated)
- `--single-file` - Generate single HTML file (default: `true`)
- `--no-single-file` - Generate multiple files

**Examples:**

```bash
# Generate single-file docs
api-tools asyncapi generate docs

# Generate multi-file docs
api-tools asyncapi generate docs --no-single-file

# Custom output and parameters
api-tools asyncapi generate docs --output public/api.html \
  --params version=2.0.0
```

#### `asyncapi generate from-template`

Generate code or documentation from AsyncAPI documents using templates.

**Usage:**

```bash
api-tools asyncapi generate from-template <template> [input] [options]
```

**Options:**

- `<template>` - **REQUIRED.** Template name or URL (e.g., `@asyncapi/html-template`)
- `[input]` - Document path (default: `asyncapi/asyncapi.yaml`)
- `--output <directory>` - Output directory (default: `dist/generated/`)
- `--params <key=value...>` - Template parameters (can be repeated)
- `--force-write` - Overwrite existing files

**Examples:**

```bash
# Generate HTML docs
api-tools asyncapi generate from-template @asyncapi/html-template

# Generate with custom output
api-tools asyncapi generate from-template @asyncapi/nodejs-template \
  --output src/generated

# Generate with parameters
api-tools asyncapi generate from-template @asyncapi/java-spring-template \
  --params javaPackage=com.example.myapp.codegen maven=true
```

#### `asyncapi lint`

Validate and lint AsyncAPI documents.

**Usage:**

```bash
api-tools asyncapi lint [input] [options]
```

**Options:**

- `[input]` - Document path (default: `asyncapi/asyncapi.yaml`)
- `--format <format>` - Output format (default: `stylish`)
  - Choices: `json`, `stylish`, `junit`, `html`, `teamcity`, `pretty`, `github-actions`, `sarif`,
    `code-climate`, `gitlab`, `markdown`
- `--output <file>` - Write output to file
- `--fail-severity <level>` - Fail threshold (default: `warn`)
  - Choices: `error`, `warn`, `info`, `hint`

**Examples:**

```bash
# Lint default AsyncAPI spec
api-tools asyncapi lint

# Lint specific file
api-tools asyncapi lint custom/spec.yaml

# JSON output
api-tools asyncapi lint --format json --output results.json

# Only fail on errors
api-tools asyncapi lint --fail-severity error
```

### Redocly Commands

#### `redocly build-docs`

Build HTML documentation from OpenAPI documents.

**Usage:**

```bash
api-tools redocly build-docs [input] [options]
```

**Options:**

- `[input]` - OpenAPI document path (default: `openapi/openapi.yaml`)
- `--output <file>` - Output HTML file (default: `dist/docs/openapi.html`)
- `--config <file>` - Config file path (overrides auto/bundled)

**Examples:**

```bash
# Generate docs with defaults
api-tools redocly build-docs

# Custom output location
api-tools redocly build-docs --output public/api-docs.html

# Custom title via passthrough
api-tools redocly build-docs -- --title "My API Documentation"
```

#### `redocly bundle`

Bundle API descriptions into a single file.

> **Note:** The `bundle` command differs from the `join` command.
> The `bundle` command takes a root OpenAPI file as input and follows the `$ref` mentions to include
> all the referenced components into a single output file. The `join` command can combine multiple
> OpenAPI files into a single unified API description file.

**Usage:**

```bash
api-tools redocly bundle [input] [options]
```

**Options:**

- `[input]` - Document path (default: `openapi/openapi.yaml`)
- `--output <path>` - Output file path (default: `dist/bundle/openapi.yaml`)
- `--ext <extension>` - Output extension (overrides `--output` extension)
  - Choices: `json`, `yaml`, `yml`
- `--dereferenced` - Generate fully dereferenced bundle (no `$ref`)
- `--config <file>` - Config file path (overrides auto/bundled)

**Examples:**

```bash
# Bundle with defaults
api-tools redocly bundle

# Bundle to JSON
api-tools redocly bundle --ext json

# Fully dereferenced bundle
api-tools redocly bundle --dereferenced

# Custom output
api-tools redocly bundle --output dist/api-bundle.yaml

# Remove unused components via passthrough
api-tools redocly bundle -- --remove-unused-components
```

#### `redocly generate-arazzo`

Generate Arazzo workflow description from OpenAPI document.

**Usage:**

```bash
api-tools redocly generate-arazzo [input] [options]
```

**Options:**

- `[input]` - OpenAPI document path (default: `openapi/openapi.yaml`)
- `--output <file>` - Output file path (default: `arazzo/auto-generated.arazzo.yaml`)

**Note:** Generated Arazzo files require manual editing to be functional.

**Examples:**

```bash
# Generate from default OpenAPI
api-tools redocly generate-arazzo

# Custom output
api-tools redocly generate-arazzo --output arazzo/workflows.arazzo.yaml
```

#### `redocly init`

Create a default `redocly.yaml` config file.

```bash
api-tools redocly init [--force]
```

#### `redocly join`

Join multiple OpenAPI 3.x documents into a single file.

> **Note:** The `join` command differs from the `bundle` command.
> The `bundle` command takes a root OpenAPI file as input and follows the `$ref` mentions to include
> all the referenced components into a single output file. The `join` command can combine multiple
> OpenAPI files into a single unified API description file.
> Unlike the `bundle` command, `join` does not execute preprocessors or decorators and combines the
> API description files as-is without modifying the original source files.

**Usage:**

```bash
api-tools redocly join <inputs...> [options]
```

**Options:**

- `<inputs...>` - **REQUIRED.** At least 2 document paths to join
- `--output <file>` - Output file path (default: `dist/join/openapi.yaml`)
- `--prefix-components-with-info-prop <property>` - Prefix component names with info property to
  resolve conflicts (e.g., `version`, `title`)
- `--prefix-tags-with-info-prop <property>` - Prefix tag names with info property (e.g., `title`, `version`)
- `--prefix-tags-with-filename` - Prefix tag names with filename to resolve conflicts
- `--without-x-tag-groups` - Skip automated `x-tagGroups` creation (avoids tag duplication)
- `--config <file>` - Config file path (overrides auto/bundled)

> **Note:** The options `--prefix-tags-with-info-prop`, `--prefix-tags-with-filename`, and
> `--without-x-tag-groups` are mutually exclusive.

**Examples:**

```bash
# Join two documents
api-tools redocly join api-1.yaml api-2.yaml

# Join with custom output
api-tools redocly join users-api.yaml orders-api.yaml \
  --output dist/combined-api.yaml

# Resolve component naming conflicts using version
api-tools redocly join museum-v1.yaml museum-v2.yaml \
  --prefix-components-with-info-prop version

# Prefix tags with title to avoid conflicts
api-tools redocly join first-api.yaml second-api.yaml \
  --prefix-tags-with-info-prop title

# Prefix tags with filename
api-tools redocly join api1/openapi.yaml api2/openapi.yaml \
  --prefix-tags-with-filename

# Skip x-tagGroups for duplicate tags
api-tools redocly join api-a.yaml api-b.yaml --without-x-tag-groups

# Advanced passthrough options
api-tools redocly join *.yaml -- --lint-config error
```

#### `redocly lint`

Validate and lint OpenAPI, AsyncAPI, and Arazzo documents using Redocly.

**Usage:**

```bash
api-tools redocly lint [input] [options]
```

**Options:**

- `[input]` - Document path (default: auto-detect)
- `--openapi` - Lint only OpenAPI at `openapi/openapi.yaml`
- `--asyncapi` - Lint only AsyncAPI at `asyncapi/asyncapi.yaml`
- `--arazzo` - Lint only Arazzo at `arazzo/arazzo.yaml`
- `--format <format>` - Output format (default: `codeframe`)
  - Choices: `codeframe`, `stylish`, `json`, `checkstyle`, `codeclimate`, `github-actions`, `markdown`, `summary`
- `--config <file>` - Config file path (overrides auto/bundled)

**Examples:**

```bash
# Auto-detect and lint all specs
api-tools redocly lint

# Lint only OpenAPI
api-tools redocly lint --openapi

# JSON output
api-tools redocly lint --format json

# Custom config
api-tools redocly lint --config custom-redocly.yaml
```

#### `redocly respect`

Execute Arazzo workflow tests.

**Usage:**

```bash
api-tools redocly respect [input] [options]
```

**Options:**

- `[input]` - Arazzo document path (default: `arazzo/arazzo.yaml`)
- `--workflow <names...>` - Run only specified workflows
- `--skip <names...>` - Skip specified workflows (conflicts with `--workflow`)
- `--verbose` - Enable verbose output
- `--input <params...>` - Workflow input parameters (`key=value` or JSON)
- `--server <overrides...>` - Server overrides (`name=url`)
- `--json-output <file>` - Save results to JSON file
- `--har-output <file>` - Save HTTP interactions to HAR file

**Examples:**

```bash
# Execute default workflows
api-tools redocly respect

# Run specific workflow
api-tools redocly respect --workflow login-flow

# Test against staging
api-tools redocly respect --server api=https://staging.example.com

# Provide inputs
api-tools redocly respect --input email=test@example.com --input password=secret

# CI/CD with JSON output
api-tools redocly respect --json-output results.json --verbose

# Advanced options via passthrough
api-tools redocly respect -- --max-steps 100 --severity '{"STATUS_CODE_CHECK":"warn"}'
```

### Spectral Commands

#### `spectral init`

Create a default `spectral.yaml` config file.

```bash
api-tools spectral init [--force]
```

#### `spectral lint`

Validate and lint OpenAPI, AsyncAPI, and Arazzo documents.

**Usage:**

```bash
api-tools spectral lint [input] [options]
```

**Options:**

- `[input]` - Document path (default: auto-detect)
- `--openapi` - Lint only OpenAPI at `openapi/openapi.yaml`
- `--asyncapi` - Lint only AsyncAPI at `asyncapi/asyncapi.yaml`
- `--arazzo` - Lint only Arazzo at `arazzo/arazzo.yaml`
- `--format <format>` - Output format (default: `stylish`)
  - Choices: `json`, `stylish`, `junit`, `html`, `text`, `teamcity`, `pretty`, `github-actions`, `sarif`, `markdown`, `gitlab`
- `--output <file>` - Write output to file
- `--ruleset <file>` - Custom ruleset (overrides auto/bundled)
- `--fail-severity <level>` - Fail threshold (default: `warn`)
  - Choices: `error`, `warn`, `info`, `hint`
- `--display-only-failures` - Show only failing results
- `--verbose` - Enable verbose output

**Examples:**

```bash
# Auto-detect and lint all specs
api-tools spectral lint

# Lint specific spec types
api-tools spectral lint --openapi
api-tools spectral lint --asyncapi --arazzo

# Lint specific file
api-tools spectral lint custom/spec.yaml

# JSON output
api-tools spectral lint --format json --output results.json

# Custom ruleset
api-tools spectral lint --ruleset .spectral.yaml

# Passthrough advanced options
api-tools spectral lint -- --ignore-unknown-format
```

## Default File Locations

The tool expects the following directory structure:

```bash
project/
├── openapi/
│   └── openapi.yaml        # Main OpenAPI spec
├── asyncapi/
│   └── asyncapi.yaml       # Main AsyncAPI spec
├── arazzo/
│   ├── arazzo.yaml         # Production Arazzo workflows
│   └── auto-generated.arazzo.yaml  # Generated starter
└── dist/
    ├── bundle/
    │   ├── openapi.yaml    # OpenAPI bundled output
    │   └── asyncapi.yaml   # AsyncAPI bundled output
    ├── format/
    │   └── asyncapi.json   # AsyncAPI format output
    ├── generated/          # AsyncAPI template output
    ├── join/
    │   └── openapi.yaml    # Joined output
    └── docs/
        ├── openapi.html    # OpenAPI docs
        └── asyncapi.html   # AsyncAPI docs (or asyncapi/ for multi-file)
```

## Configuration Files

### Auto-Discovery

The tool automatically discovers local config files:

- `.spectral.yaml`, `.spectral.yml`, `.spectral.json`, `.spectral.js`, `.spectral.mjs`,
  `spectral.yaml`, `spectral.yml`, `spectral.json`, `spectral.js`, `spectral.mjs`
- `.redocly.yaml`, `.redocly.yml`, `redocly.yaml`, `redocly.yml`

### Bundled Defaults

If no local config exists, opinionated bundled configs are used with stricter-than-default rules:

- **Spectral**: `defaults/spectral.yaml` - Comprehensive OpenAPI/AsyncAPI/Arazzo validation
- **Redocly**: `defaults/redocly.yaml` - Strict API design standards

These bundled configs enforce best practices and may be more restrictive than upstream tool defaults.
Create a local config file to customize rules for your project.

### Custom Configs

Override with CLI options:

```bash
api-tools spectral lint --ruleset custom/.spectral.yaml
api-tools redocly lint --config custom/redocly.yaml
```

## Passthrough Arguments

For advanced options not exposed by the wrapper, use `--` to pass arguments directly to the underlying tool:

```bash
# Spectral advanced options
api-tools spectral lint -- --ignore-unknown-format

# Redocly advanced options
api-tools redocly bundle -- --remove-unused-components
api-tools redocly respect -- --max-steps 100 --execution-timeout 1800000
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: API Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      - uses: actions/setup-node@v6
        with:
          node-version: "24"

      - name: Install dependencies
        run: npm ci
        env:
          GITHUB_PACKAGES_TOKEN: ${{ secrets.GITHUB_PACKAGES_TOKEN }}

      - name: Lint with Spectral
        run: npm run lint:spectral -- --format github-actions

      - name: Lint with Redocly
        run: npm run lint:redocly -- --format github-actions

      - name: Bundle spec
        run: npm run bundle

      - name: Generate docs
        run: npm run docs

      - name: Test workflows
        run: npm run test:api -- --verbose

      # Alternative: Call CLI directly (useful for matrix builds or custom workflows)
      # - name: Lint OpenAPI with Spectral
      #   run: npx api-tools spectral lint --openapi --format github-actions

      # Optional: Save results as artifacts
      - name: Generate test report
        if: always()
        run: npm run test:api -- --json-output results.json

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v6
        with:
          name: api-test-results
          path: results.json
```

## Common Workflows

### Development

```bash
# Lint using Spectral during development
api-tools spectral lint --openapi

# Lint using Redocly during development
api-tools redocly lint --openapi

# Lint AsyncAPI during development
api-tools asyncapi lint

# Generate docs for local preview
api-tools redocly build-docs
api-tools asyncapi build-docs
```

### Pre-commit

```bash
# Fast validation
api-tools spectral lint
api-tools redocly lint
api-tools asyncapi lint
```

### CI Pipeline

```bash
# Full validation with outputs
api-tools spectral lint --format github-actions
api-tools redocly lint --format github-actions
api-tools asyncapi lint --format github-actions
api-tools redocly bundle --output dist/openapi.yaml
api-tools asyncapi bundle --output dist/asyncapi.yaml
api-tools redocly build-docs --output dist/api-docs.html
api-tools asyncapi build-docs --output dist/asyncapi-docs.html
```

### API Testing

```bash
# Run Arazzo workflows against staging
api-tools redocly respect \
  --server api=https://staging.example.com \
  --input apiKey=${STAGING_API_KEY} \
  --json-output test-results.json \
  --verbose

# Bundle AsyncAPI for deployment
api-tools asyncapi bundle --output dist/asyncapi-production.yaml

# Convert AsyncAPI to JSON for tooling
api-tools asyncapi format --ext json --output dist/asyncapi.json
```

## Troubleshooting

### Command not found

Ensure the package is installed and npm scripts are configured:

```bash
npm install -D @bymbly/api-tools@latest
```

### Config not found

Check config file names and locations. Use `--config` or `--ruleset` to specify custom paths.

### Bundled config issues

To use your own config instead of bundled defaults, create a local config file that will be auto-discovered.

## Contributing

Issues and pull requests welcome at [github.com/bymbly/api-tools](https://github.com/bymbly/api-tools)!

## License

[Apache License, Version 2.0](LICENSE)
