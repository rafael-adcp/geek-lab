import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function userDirectory(os) {
  return path.join(os.homedir(), 'geek-lab_local');
}

export function internalFile(os, fileName) {
  return path.join(userDirectory(os), fileName);
}

export function defaultActionsPath() {
  return path.join(__dirname, '../actions');
}
