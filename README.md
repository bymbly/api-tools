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

## Contributing

Issues and pull requests welcome!

## License

[Apache License, Version 2.0](https://github.com/bymbly/openapi-tools/blob/main/LICENSE)
