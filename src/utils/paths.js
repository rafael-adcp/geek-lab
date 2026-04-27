import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function userDirectory() {
  return path.join(os.homedir(), 'geek-lab_local');
}

export function internalFile(fileName) {
  return path.join(userDirectory(), fileName);
}

export function defaultActionsPath() {
  return path.join(__dirname, '../actions');
}

export function metricsTemplatePath() {
  return path.join(__dirname, '../handlebars/metrics_template.hb');
}
