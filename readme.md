# Geek Lab

A cross-platform CLI for collecting, sharing and running your team's everyday scripts from one place.

[![Node CI](https://github.com/rafael-adcp/geek-lab/actions/workflows/nodejs.yml/badge.svg)](https://github.com/rafael-adcp/geek-lab/actions/workflows/nodejs.yml)
[![npm version](https://img.shields.io/npm/v/geek-lab.svg)](https://www.npmjs.com/package/geek-lab)
[![license](https://img.shields.io/npm/l/geek-lab.svg)](LICENSE)

## Why Geek Lab?

- **Onboard fast.** Ramp new teammates into a project or organization without a wiki tour.
- **Swap context easily.** Jump between projects and run your favorite scripts from any machine.
- **Cross-platform.** Same UX on Windows, macOS and Linux.
- **Language-agnostic.** Wrap your `.py`, `.sh`, `.java`, `.ps1`… anything you can shell out to.
- **Shareable.** Publish a folder of "custom actions" so your team / community can pull them in.

## Requirements

- **Node.js 22.12** or newer (current LTS line; Node 24 also supported).
- npm 10+ (ships with Node 22).

> **Note:** geek-lab v2 is published as native ESM. If you maintain custom actions, see the [migration notes](docs/custom-actions.md#action-file-shape) — CommonJS action files keep working, the dependency-injection factory shape is the recommended one going forward.

## Installation

```sh
npm i -g geek-lab
```

After install, any of these aliases are available: `geek-lab`, `glab`, `geekl`, `gik`.

## Quick start

```sh
# show all commands (built-in + custom)
gik --help

# inspect / locate your config file
gik config

# point the cli at one or more folders of custom scripts
# (edit "customActionsPath" inside the config file shown above)
```

## Documentation

- [Custom actions](docs/custom-actions.md) — how to plug your own scripts into the CLI.
- [Dev setup](docs/dev-setup.md) — running geek-lab locally while you contribute.

## Releasing

```sh
git fetch
git pull origin master

npm version patch     # or minor / major — also creates a matching git tag
npm publish

git push origin master --no-verify
git push origin --tags --no-verify
```

## License

[MIT](LICENSE)
