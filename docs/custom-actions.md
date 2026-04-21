# Custom Actions

Custom actions let you plug your own scripts into geek-lab so they show up alongside the built-in commands. Use them to:

- Make life easier when swapping between projects or machines.
- Centralize the "magic scripts" each team accumulates.
- Share useful tooling across teammates without each person reinventing it.

## The mental model

Picture a company with several teams on different stacks and operating systems. We bet that:

- Each team owns a set of **magic scripts** that perform some **witchcraft** or grab info faster than doing it manually.
- Most developers also have a handful of personal scripts they wish everyone could use.

Custom actions wrap that scattered tribal knowledge into one CLI everyone already has installed.

```
Sample usage of "custom-actions"
+------------------------+
|                        |
|  geek-lab              |
|  (globally installed)  |
|                        |
+----|----|----|---------+
     |    |    |
     |    |    |
     |    |    |               +----------------------------------------------+
     |    |    |               | geek-lab                                     |
     |    |    |               | (at your local machine after npm i...)       |
     |    |    ----------------- geek-lab config # to see path                |
     |    |                    | eg: /home/USER/geek-lab_local                |
     |    |                    | where your config / metrics file are stored  |
     |    |                    +----------------------------------------------+
     |    |
     |    |                    +----------------------------------------------+
     |    |                    | /home/USER/awesome_team1/custom_actions      |
     |    |                    | # add this path to your cli config           |
     |    ---------------------- # and all actions inside of that folder will |
     |                         | # appear when you do "geek-lab help"         |
     |                         +----------------------------------------------+
     |
     |                         +----------------------------------------------+
     |                         | /home/USER/awesome_team2/custom_actions      |
     --------------------------- # add this path to your cli config           |
                               | # and all actions inside of that folder will |
                               | # appear when you do "geek-lab help"         |
                               +----------------------------------------------+

created with: https://textik.com/
```

## Wiring custom action paths

Open your config file (use `gik config` to find its location, typically `~/geek-lab_local/config_geek-lab.json`) and set `customActionsPath` to one or more directories:

```jsonc
{
  // ...
  "customActionsPath": [
    "/home/USER/awesome_team1/custom_actions",
    "/home/USER/awesome_team2/custom_actions"
  ]
  // ...
}
```

Every `.js` file inside those paths is loaded automatically and surfaced via `gik --help` next to the built-in commands.

> **Heads-up:** every file in those paths must be a valid action module (see the shape below). Anything else will fail to load and break the CLI.

## Action file shape

A custom action is a [yargs command module](https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module) with four exports:

```javascript
// file name: custom_action_sample.js

/* useful references:
   https://github.com/yargs/yargs/blob/master/docs/advanced.md
   http://yargs.js.org/
   and the built-in actions in geek-lab/src/actions
*/

exports.command = 'COMMAND';
exports.describe = 'DESCRIPTION';

exports.builder = (yargs) => yargs
  .example('$0 COMMAND', 'description of what this usage will do');

exports.handler = () => {
  console.log('All the things :: your first custom action worked');
};
```

| Export      | Required | Purpose                                                                |
|-------------|----------|------------------------------------------------------------------------|
| `command`   | yes      | The CLI verb users will type (e.g. `gik COMMAND`). Must be unique.     |
| `describe`  | yes      | One-line summary printed by `gik --help`.                              |
| `builder`   | no       | yargs builder — declare flags, positional args, examples.              |
| `handler`   | yes      | Async-compatible function executed when the command runs.              |

## Best practices

- **Keep names unique.** geek-lab refuses to start if two actions share the same `command`. Prefix team-specific verbs (e.g. `team1:deploy`) to avoid clashes when combining multiple folders.
- **Don't bundle secrets.** Read tokens from your geek-lab config (`UTILS.getConfigValue(...)`) or environment variables — never hard-code them into the action file.
- **Be cross-platform.** Prefer Node-native APIs (`fs`, `path`, `child_process`) over OS-specific shell tricks if you intend to share the action.
- **Fail loudly.** Throw or `console.error` + `process.exitCode = 1` on errors so callers (and CI scripts) notice.

## Sharing across machines

Custom action folders are just directories of `.js` files — keep them under version control and `git clone` them on each machine, then point `customActionsPath` at the local clone. A common pattern is one repo per team plus one personal repo.
