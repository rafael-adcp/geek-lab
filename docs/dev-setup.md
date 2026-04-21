# Dev Setup

How to get geek-lab running locally so you can hack on it.

## Prerequisites

- **Node.js 22+** (current LTS) — Node 24 is also supported.
- **npm 10+** (bundled with Node 22).
- **git**.

> Tip: use [nvm](https://github.com/nvm-sh/nvm) (or [nvm-windows](https://github.com/coreybutler/nvm-windows)) to switch Node versions painlessly.

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
# run the test suite (mocha + nyc coverage)
npm test

# lint
npm run lint

# wipe node_modules / coverage / lockfile and reinstall from scratch
npm run rebuild
```

The HTML coverage report is written to `coverage/index.html` after `npm test`.

## Project layout

```
bin/             # CLI entrypoint (geek-lab.js)
src/
  actions/       # built-in commands (yargs modules)
  lib/           # shared utilities (config, http, mysql, metrics)
  scripts/       # post-install bootstrapping
test/            # mocha specs (mirrors the src/ tree)
docs/            # user-facing docs
```

## Adding a built-in action

A built-in action is just a [yargs command module](https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module) dropped into `src/actions/`. Look at the existing files there for the expected `command` / `describe` / `builder` / `handler` shape — and add a matching spec under `test/actions/`.

## CI

Pushes run `.github/workflows/nodejs.yml`, which executes `npm ci`, `npm run lint` and `npm test` against the supported Node versions. Keep that workflow green before opening a PR.
