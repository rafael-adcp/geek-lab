#!/usr/bin/env node
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';

import axios from 'axios';

// mysql2 is loaded dynamically so the e2e suite can inject a fake driver
// via GEEK_LAB_MYSQL2_MODULE without touching production behavior.
const mysql2 = (await import(
  process.env.GEEK_LAB_MYSQL2_MODULE
    ? pathToFileURL(process.env.GEEK_LAB_MYSQL2_MODULE).href
    : 'mysql2/promise'
)).default;

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import * as paths from '../src/utils/paths.js';
import * as clock from '../src/utils/clock.js';
import * as config from '../src/utils/config/index.js';
import * as metrics from '../src/utils/metrics/index.js';
import * as httpUtil from '../src/utils/http/index.js';
import * as mysqlUtil from '../src/utils/mysql/index.js';
import * as actionsUtil from '../src/utils/actions/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));

const configPath = paths.internalFile('config_geek-lab.json');
const metricsPath = paths.internalFile('metrics_geek-lab.json');

const readConfig = () => config.readConfig(fs, configPath);
const resolveConfigValue = (key) => config.resolveValue(readConfig(), key);
const writeConfig = (data) => config.writeConfig(fs, configPath, data);

// update-notifier is ESM-only since v6; fire-and-forget via dynamic import
// so we never block the CLI even if the network check is slow. Failures
// are surfaced to stderr only when config.debugMode is true so a regression
// in update-notifier itself doesn't go unnoticed during debugging.
/* c8 ignore start */
import('update-notifier')
  .then(({ default: updateNotifier }) => updateNotifier({ pkg, updateCheckInterval: 1000 }).notify())
  .catch((e) => {
    try {
      if (readConfig().debugMode) {
        console.error('[geek-lab] update-notifier check failed:', e);
      }
    } catch { /* config unreadable — stay silent on the advisory path */ }
  });
/* c8 ignore stop */

const httpClient = httpUtil.createHttpClient({
  axios,
  fs,
  getToken: () => readConfig().token,
  getBaseUrl: () => resolveConfigValue('apiUrl'),
});

const mysqlClient = mysqlUtil.createMysqlClient({
  mysql2,
  getCreds: () => ({
    host: resolveConfigValue('mysqlHost'),
    user: resolveConfigValue('mysqlUser'),
    password: resolveConfigValue('mysqlPassword'),
  }),
});

const readMetrics = () => metrics.readMetrics(fs, metricsPath);

const recordMetrics = (command) => metrics.recordCommand({
  fs,
  metricsPath,
  clock,
  command,
  enabled: readConfig().collectMetrics,
});

const deps = {
  config: {
    read: readConfig,
    write: writeConfig,
    resolveValue: resolveConfigValue,
  },
  paths: {
    userDirectory: paths.userDirectory,
    defaultActions: paths.defaultActionsPath,
  },
  actions: {
    list: (dirs) => actionsUtil.listFiles({ fs, pathLib: path, dirs }),
  },
  metrics: {
    read: readMetrics,
  },
  http: { request: httpClient.request },
  mysql: { query: mysqlClient.query },
  clock,
};

const actions = await actionsUtil.discoverActions({
  fs,
  pathLib: path,
  loader: (file) => import(pathToFileURL(file).href),
  dirs: [paths.defaultActionsPath(), ...(readConfig().customActionsPath ?? [])],
  deps,
});

const cli = yargs(hideBin(process.argv))
  .scriptName('geek-lab')
  .version(pkg.version)
  .strictCommands()
  .recommendCommands();

for (const action of actions) {
  cli.command(action);
}

const argv = await cli
  .epilogue('for more information, check project repo https://github.com/rafael-adcp/geek-lab')
  .demandCommand(1, '')
  .wrap(cli.terminalWidth())
  .parse();

recordMetrics(String(argv._[0]));
