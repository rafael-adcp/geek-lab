# Dev Setup

How to get geek-lab running locally so you can hack on it.

## Prerequisites

- **Node.js 22.12+** (current LTS) — Node 24 is also supported.
- **npm 10+** (bundled with Node 22).
- **git**.

> Tip: use [nvm](https://github.com/nvm-sh/nvm) (or [nvm-windows](https://github.com/coreybutler/nvm-windows)) to switch Node versions painlessly.
>
> geek-lab v2 is native ESM. The minimum Node version is enforced by `engines` in `package.json` and matched in CI.

## Clone & install

```sh
git clone https://github.com/rafael-adcp/geek-lab.git
cd geek-lab
npm ci
```

`npm ci` is preferred over `npm install` for reproducible builds — it installs the exact versions from `package-lock.json`.

## Run your local build globally

```sh
npm link
```

This registers your working copy as the global `geek-lab` install. Call it via any alias defined in `package.json`'s `bin` block:

```sh
geek-lab --help
glab --help
geekl --help
gik --help
```

To unlink later:

```sh
npm unlink -g geek-lab
```

## Common workflows

```sh
# run the test suite (mocha + c8 coverage)
npm test

# lint
npm run lint

# wipe node_modules / coverage / lockfile and reinstall from scratch
npm run rebuild
```

The HTML coverage report is written to `coverage/index.html` after `npm test`. Coverage thresholds (100/100/100/100) live in `.c8rc.json`.

## Project layout

```
bin/             # CLI entrypoint (geek-lab.js) — wires deps, discovers actions
src/
  actions/       # built-in commands as DI factories: deps => yargs command
  utils/         # single-responsibility utilities: config / http / mysql / metrics / paths / clock / actions
  scripts/       # post-install bootstrapping
  handlebars/    # metrics report templates
test/
  bin/           # CLI smoke tests
  e2e/           # end-to-end specs that spawn the CLI against a temp HOME
  utils/         # focused unit tests for non-trivial utilities
  helpers/       # shared e2e harness
docs/            # user-facing docs
```

## Adding a built-in action

Built-in actions are **dependency-injection factories** — a default-exported function that receives the `deps` bag from `bin/geek-lab.js` and returns a [yargs command module](https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module). Mirror an existing file under `src/actions/`, then cover the new behaviour with an e2e spec under `test/e2e/` (or a focused unit test under `test/utils/` if the logic is not user-visible).

## CI

Pushes run `.github/workflows/nodejs.yml`, which executes `npm ci`, `npm run lint` and `npm test` against the supported Node versions. Keep that workflow green before opening a PR.
