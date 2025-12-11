# Bymbly OpenAPI Tools

Shared Tooling for OpenAPI Specs

To use, add this to your local `.npmrc`:

```bash
@bymbly:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

Create a GitHub PAT (classic) with a scope of: `read:packages`

Set the environment variable: `GITHUB_PACKAGES_TOKEN` to your PAT.
This replaces normal `npm login` creds, and allows access to GitHub's package registry.

Then install the package:

```bash
npm install -D @bymbly/openapi-tools@latest
```

Now you can add tooling to your local `package.json`:

```json
"scripts": {
  "bundle": "openapi-bundle",
  "lint": "openapi-lint"
}
```

See:

- [Authenticating to GitHub Packages](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages)
- [Publishing packages to GitHub Packages](https://docs.github.com/en/actions/how-tos/use-cases-and-examples/publishing-packages/publishing-nodejs-packages)

## Configuration

Configure via the following environment variables:

`OPENAPI_INPUT` - File to process (**default**: `./openapi/openapi.yaml`)

`OPENAPI_OUTPUT` - Where to write output file (**default**: `./dist/openapi.yaml`)

`OPENAPI_FORMAT` - Output format (**default**: `yaml`)

`OPENAPI_LINT_FORMAT` - Linter report format (**default**: `codeframe`)

`OPENAPI_CONFIG_PATH` - Path to redocly.yaml (**default**: `./redocly.yaml`)
