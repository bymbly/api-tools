# OpenAPI Tools

Standardized CLI tooling for OpenAPI specifications.
Provides consistent conventions and environment-based configuration.

## Installation

1. Configure npm to use Github Packages for `@bymbly` scope:

   ```bash
   # Add to .npmrc in your project or globally (~/.npmrc)
   @bymbly:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
   ```

1. Create a GitHub Personal Access Token (Classic) with `read:packages` scope.

1. Set environment variable:

   ```bash
   export GITHUB_PACKAGES_TOKEN=your_ghp_token_here
   ```

   This replaces normal `npm login` credentials, and allows access to GitHub's package registry.

   [Github Packages Authentication Docs](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages)

1. Then install the package:

   ```bash
   npm install -D @bymbly/openapi-tools@latest
   ```

## Quick Start

Add to your `package.json`:

```json
{
  "scripts": {
    "bundle": "redocly-bundle",
    "lint": "redocly-lint",
    "docs": "redocly-build-docs",
    "arazzo": "redocly-generate-arazzo",
    "respect": "redocly-respect",
    "validate": "npm run lint && npm run bundle && npm run docs"
  }
}
```

Run:

```bash
npm run bundle # Bundles openapi/openapi.yaml -> dist/openapi.yaml
npm run lint # Lints openapi/openapi.yaml
npm run docs # Generates dist/openapi.html
npm run arazzo # Generates dist/auto-generated.arazzo.yaml
npm run respect # Tests arazzo/*.arazzo.yaml workflows
```

## Available Commands

### Redocly Commands

<!-- markdownlint-disable MD013 -->

| Command                   | Description                              | Default Input          | Default Output                    |
| ------------------------- | ---------------------------------------- | ---------------------- | --------------------------------- |
| `redocly-bundle`          | Bundle OpenAPI specs with $refs resolved | `openapi/openapi.yaml` | `dist/openapi.yaml`               |
| `redocly-lint`            | Lint OpenAPI specs                       | `openapi/openapi.yaml` | terminal output                   |
| `redocly-build-docs`      | Generate HTML documentation              | `openapi/openapi.yaml` | `dist/openapi.html`               |
| `redocly-generate-arazzo` | Generate Arazzo workflow descriptions    | `openapi/openapi.yaml` | `dist/auto-generated.arazzo.yaml` |
| `redocly-respect`         | Test Arazzo workflows                    | `arazzo/*.arazzo.yaml` | terminal output                   |

<!-- markdownlint-enable MD013 -->

## Configuration

All commands use environment variables with sensible defaults:

### `OPENAPI_INPUT`

Path to your OpenAPI specification file.

**Default:** `openapi/openapi.yaml`

**Example:**

```bash
OPENAPI_INPUT=api/spec.yaml redocly-bundle
```

### `OPENAPI_OUTPUT`

Where to write output files.

**Defaults:**

- `redocly-bundle`: `dist/openapi.yaml` (extension added based on format)
- `redocly-build-docs`: `./dist/openapi.html`
- `redocly-generate-arazzo`: `dist/auto-generated.arazzo.yaml`

**Example:**

```bash
OPENAPI_OUTPUT=public/api.html redocly-build-docs
```

### `OPENAPI_FORMAT`

Output or report format.

**Defaults:**

- `redocly-bundle`: `yaml` (options `yaml`, `json`)
- `redocly-lint`: `codeframe` (options: `codeframe`, `stylish`, `json`,
  `checkstyle`, `codeclimate`, `github-actions`, `markdown`, `summary`)

**Example:**

```bash
OPENAPI_FORMAT=json redocly-bundle
OPENAPI_FORMAT=github-actions redocly-lint
```

### `OPENAPI_CONFIG`

Path to Redocly configuration file.

**Default:** Auto-discovered (`redocly.yaml` in project root) or Redocly defaults

**Example:**

```bash
OPENAPI_CONFIG=.config/redocly.yaml redocly-lint
```

### `ARAZZO_INPUT`

Path to your Arazzo workflow(s). Supports glob patterns.

**Default:** `arazzo/*.arazzo.yaml`

**Example:**

```bash
ARAZZO_INPUT=api/arazzo.yaml redocly-respect
```

### `ARAZZO_VERBOSE`

Set to `true` for verbose output.

**Default:** `false`

**Example:**

```bash
ARAZZO_VERBOSE=true redocly-respect
```

### `ARAZZO_HAR_OUTPUT`

HAR file output path (for debugging HTTP traffic).

**Default:** none

**Example:**

```bash
ARAZZO_HAR_OUTPUT=logs/arazzo.har redocly-respect
```

### `ARAZZO_JSON_OUTPUT`

JSON file output path (for debugging).

**Default:** none

**Example:**

```bash
ARAZZO_JSON_OUTPUT=logs/arazzo.json redocly-respect
```

## Redocly's Native Environment Variables

Some Redocly command support native environment variables for advanced configuration:

### `REDOCLY_CLI_RESPECT_INPUT`

Input parameters as JSON or key=value pairs.

**Example:**

```bash
REDOCLY_CLI_RESPECT_INPUT='userEmail=name@redocly.com,userPassword=12345' redocly-respect
REDOCLY_CLI_RESPECT_INPUT='{"key":"value","nested":{"nestedKey":"nestedValue"}}' redocly-respect
```

[Redocly `respect` Documentation](https://redocly.com/docs/cli/commands/respect)

### `REDOCLY_CLI_RESPECT_SERVER`

Server overrides.

**Example:**

```bash
REDOCLY_CLI_RESPECT_SERVER="sourceDescriptionName1=https://example.com" redocly-respect
```

[Redocly `respect` Documentation](https://redocly.com/docs/cli/commands/respect)

### `REDOCLY_CLI_RESPECT_MAX_STEPS`

Maximum number of steps to run.

**Example:**

```bash
REDOCLY_CLI_RESPECT_MAX_STEPS=50 redocly-respect
```

[Redocly `respect` Documentation](https://redocly.com/docs/cli/commands/respect)

### `REDOCLY_CLI_RESPECT_MAX_FETCH_TIMEOUT`

Maximum time to wait for API response per request in milliseconds.

**Example:**

```bash
REDOCLY_CLI_RESPECT_MAX_FETCH_TIMEOUT=60000 redocly-respect
```

[Redocly `respect` Documentation](https://redocly.com/docs/cli/commands/respect)

### `REDOCLY_CLI_RESPECT_EXECUTION_TIMEOUT`

Maximum time to wait for `respect` command execution in milliseconds.

**Example:**

```bash
REDOCLY_CLI_RESPECT_EXECUTION_TIMEOUT=1800000 redocly-respect
```

[Redocly `respect` Documentation](https://redocly.com/docs/cli/commands/respect)

## Contributing

Issues and pull requests welcome!

## License

[Apache License, Version 2.0](https://github.com/bymbly/openapi-tools/blob/main/LICENSE)
