const ACTION_EXTENSIONS = new Set(['.js', '.mjs', '.cjs']);

export function listFiles({ fs, pathLib, dirs, warn = console.warn }) {
  const files = new Set();
  for (const dir of dirs) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { recursive: true, withFileTypes: true });
    } catch (e) {
      if (e.code === 'ENOENT') {
        warn(`[geek-lab] skipping customActionsPath "${dir}": directory does not exist`);
        continue;
      }
      throw e;
    }
    for (const entry of entries) {
      if (entry.isFile()) {
        files.add(pathLib.join(entry.parentPath, entry.name));
      }
    }
  }
  return [...files];
}

async function loadActionFromFile({ loader, file, deps, warn }) {
  let action;
  try {
    const loaded = await loader(file);
    const mod = loaded.default;
    action = typeof mod === 'function' ? mod(deps) : mod;
  } catch (e) {
    warn(`[geek-lab] skipping "${file}": failed to load (${e.message})`);
    return null;
  }
  if (!action || typeof action.command !== 'string') {
    warn(`[geek-lab] skipping "${file}": does not export a valid action shape`);
    return null;
  }
  return action;
}

export async function discoverActions({ fs, pathLib, loader, dirs, deps, warn = console.warn }) {
  const files = listFiles({ fs, pathLib, dirs, warn })
    .filter((file) => ACTION_EXTENSIONS.has(pathLib.extname(file)));

  const seen = new Map();
  const actions = [];

  for (const file of files) {
    const action = await loadActionFromFile({ loader, file, deps, warn });
    if (!action) continue;

    const existing = seen.get(action.command);
    if (existing) {
      throw new Error(
        `Duplicate command provided: "${action.command}" from "${file}" already defined by "${existing}"`,
        { cause: { command: action.command, file, existingFile: existing } }
      );
    }
    seen.set(action.command, file);
    actions.push(action);
  }
  return actions;
}
