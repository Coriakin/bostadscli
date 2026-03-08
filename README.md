# bostadstockholm

CLI for fetching available apartments from `bostad.stockholm.se` using direct HTTP (`/AllaAnnonser/`) and website-compatible filtering.

## Requirements

- Node.js 20+

## Local development

```bash
npm install
npm test
npm run build
node dist/cli.js --help
```

## Usage

```bash
bostadstockholm --s <south> --n <north> --w <west> --e <east> [options]
```

Required bounds:
- `--s`
- `--n`
- `--w`
- `--e`

Options:
- `--sort annonserad-fran-desc|annonserad-till-asc|hyra-asc|yta-asc|antal-rum-asc|omrade-asc`
- `--min-antal-rum <number>`
- `--max-antal-rum <number>`
- `--max-hyra <number>`
- `--vanlig`
- `--student`
- `--ungdom`
- `--senior`
- `--korttid`
- `--json`
- `--timeout-ms <number>`
- `--config <path>` (optional config file path)

If no `--config` is provided, the CLI automatically reads `./bostadstockholm.config.json` if it exists.
All config values are optional; CLI flags always win.

A placeholder config is available at [bostadstockholm.config.example.json](./bostadstockholm.config.example.json).

## Example

Equivalent to your sample URL filters (`sort=yta-asc`, `minAntalRum=4`, `vanlig=1`, `maxHyra=18000`):

```bash
node dist/cli.js \
  --s 58.52526 --n 60.01821 --w 16.85577 --e 18.87726 \
  --sort yta-asc --min-antal-rum 4 --vanlig --max-hyra 18000
```

## GitHub CI and releases

This repo includes:
- CI workflow: `.github/workflows/ci.yml`
- Release workflow: `.github/workflows/release.yml`

Release workflow behavior:
- Trigger: push tag `v*` (for example `v0.1.0`)
- Runs tests + build
- Builds standalone binaries with `pkg` for:
  - macOS arm64
  - Linux x64
  - Linux arm64
- Publishes release assets:
  - `bostadstockholm_<version>_<os>_<arch>.tar.gz`
  - `SHA256SUMS`
- Optionally publishes npm package if `NPM_TOKEN` is configured.

Create a release:

```bash
git tag v0.1.0
git push origin v0.1.0
```

## npm publishing

The package is publish-ready:
- includes `dist`, `README.md`, `LICENSE` only
- runs `npm run test && npm run build` via `prepublishOnly`

To publish manually:

```bash
npm publish
```

## Homebrew tap (separate repo)

Use a dedicated tap repo, for example: `OWNER/homebrew-bostadstockholm`.

In the tap repo, place formula at:
- `Formula/bostadstockholm.rb`

Template formula is provided here:
- [packaging/homebrew/Formula/bostadstockholm.rb](./packaging/homebrew/Formula/bostadstockholm.rb)

You can generate a formula for a specific release with:

```bash
node scripts/generate-homebrew-formula.mjs \
  --owner OWNER \
  --repo bostadstockholm-cli \
  --version 0.1.0 \
  --macos-arm64-sha <ARM64_SHA256>
```

Get checksums from `SHA256SUMS` in the GitHub release.

### Install via Homebrew

```bash
brew tap OWNER/bostadstockholm-cli
brew install bostadstockholm
brew upgrade bostadstockholm
```

Homebrew installation uses the standalone binary and does not require Node on the target machine.

## Release smoke tests

For each release asset:

```bash
./bostadstockholm --help
./bostadstockholm --config bostadstockholm.config.json --json
```

For tap validation:

```bash
brew tap OWNER/bostadstockholm-cli
brew install bostadstockholm
bostadstockholm --help
```
