import _ from 'lodash';

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

export async function discoverActions({ fs, pathLib, loader, dirs, deps }) {
  const files = listFiles({ fs, pathLib, dirs });
  const seen = [];
  const actions = [];

  for (const file of files) {
    const loaded = await loader(file);
    const mod = loaded.default;
    const action = typeof mod === 'function' ? mod(deps) : mod;
    actions.push(action);
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
  }
  return actions;
}

