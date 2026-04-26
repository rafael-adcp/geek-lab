import _ from 'lodash';

const ACTION_EXTENSIONS = new Set(['.js', '.mjs', '.cjs']);

export function listFiles({ fs, pathLib, dirs }) {
  let files = [];
  for (const dir of dirs) {
    const entries = fs.readdirSync(dir, { recursive: true, withFileTypes: true });
    const filePaths = entries
      .filter((entry) => entry.isFile())
      .map((entry) => pathLib.join(entry.parentPath, entry.name));
    files = _.union(files, filePaths);
  }
  return files;
}

export async function discoverActions({ fs, pathLib, loader, dirs, deps, warn = console.warn }) {
  const files = listFiles({ fs, pathLib, dirs })
    .filter((file) => ACTION_EXTENSIONS.has(pathLib.extname(file)));

  const seen = [];
  const actions = [];

  for (const file of files) {
    let action;
    try {
      const loaded = await loader(file);
      const mod = loaded.default;
      action = typeof mod === 'function' ? mod(deps) : mod;
    } catch (e) {
      warn(`[geek-lab] skipping "${file}": failed to load (${e.message})`);
      continue;
    }

    if (!action || typeof action.command !== 'string') {
      warn(`[geek-lab] skipping "${file}": does not export a valid action shape`);
      continue;
    }

    const dup = _.find(seen, (o) => _.isEqual(o.command, action.command));
    if (dup) {
      console.log(
        `Duplicate command provided, commands should be unique!
          command "${action.command}"
          from ${file}
          already exists
          it was originally added from: ${dup.path}`
      );
      throw new Error('Duplicate command provided');
    }
    seen.push({ command: action.command, path: file });
    actions.push(action);
  }
  return actions;
}

