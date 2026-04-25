#!/usr/bin/env node
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath, pathToFileURL } from 'url';

import axios from 'axios';
import mysql2 from 'mysql2/promise';

import toString from 'lodash/toString.js';
import isEmpty from 'lodash/isEmpty.js';
import find from 'lodash/find.js';
import union from 'lodash/union.js';

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

// update-notifier is ESM-only since v6; fire-and-forget via dynamic import
// so we never block the CLI even if the network check is slow.
/* c8 ignore next 4 */
import('update-notifier')
  .then(({ default: updateNotifier }) => updateNotifier({ pkg, updateCheckInterval: 1000 }).notify())
  .catch(() => { /* advisory check — never block the CLI */ });

const configPath = paths.internalFile(os, 'config_geek-lab.json');
const metricsPath = paths.internalFile(os, 'metrics_geek-lab.json');

const readConfig = () => config.readConfig(fs, configPath);
const resolveConfigValue = (key) => config.resolveValue(readConfig(), key);
const writeConfig = (data) => config.writeConfig(fs, configPath, data);

const httpClient = httpUtil.createHttpClient({
  axios,
  fs,
  getToken: () => readConfig().token,
  getBaseUrl: () => resolveConfigValue('apiUrl'),
});

const mysqlClient = mysqlUtil.createMysqlClient({
  mysql2,
  /* c8 ignore start */
  // only fires when an action calls deps.mysql.query against a real DB;
  // mysql actions are unit-tested with an injected mysql.query stub.
  getCreds: () => ({
    host: resolveConfigValue('mysqlHost'),
    user: resolveConfigValue('mysqlUser'),
    password: resolveConfigValue('mysqlPassword'),
  }),
  /* c8 ignore stop */
});

const customActionsPath = () => {
  const configured = readConfig().customActionsPath;
  return isEmpty(configured) ? [] : configured;
};

const readMetrics = () => metrics.readMetrics(fs, metricsPath);

const recordMetrics = (command) => {
  if (!readConfig().collectMetrics) return;
  const normalized = isEmpty(command) ? 'geek-lab' : command;
  const updated = metrics.recordUsage({ store: readMetrics(), clock, command: normalized });
  metrics.writeMetrics(fs, metricsPath, updated);
};

const deps = {
  config: {
    read: readConfig,
    write: writeConfig,
    resolveValue: resolveConfigValue,
  },
  paths: {
    userDirectory: () => paths.userDirectory(os),
    defaultActions: () => paths.defaultActionsPath(),
    list: (dirs) => actionsUtil.listFiles({ fs, pathLib: path, dirs }),
  },
  metrics: {
    read: readMetrics,
  },
  http: { request: httpClient.request },
  mysql: { query: mysqlClient.query },
};

const actions = await actionsUtil.discoverActions({
  fs,
  pathLib: path,
  loader: (file) => import(pathToFileURL(file).href),
  dirs: union([paths.defaultActionsPath()], customActionsPath()),
  deps,
});

const cli = yargs(hideBin(process.argv))
  .scriptName('geek-lab')
  .version(pkg.version);

for (const action of actions) {
  /*
    we cant use
    .commandDir(rootPath, { recurse: true }) because we need to know all the commands to prevent
    command colisions
  */
  cli.command(action);
}

const provided = toString(
  Array.prototype.slice.call(process.argv, 2)[0]
);

const commandExists = find(actions, (o) => { return o.command === provided; });

//showing cli tool help when an invalid command is provided
if (
  !isEmpty(provided) &&
  provided !== '--help' && //yargs default param to show help
  provided !== '--version' && //yargs default param to show version
  !commandExists //if command donot exist
) {
  console.log(`Invalid command provided "${provided}", see available options below`);
  cli.showHelp();
} else {
  //preventing invalid actions to be stored on metrics
  recordMetrics(provided);
}

await cli
  //apending a message at the botton of help command
  .epilogue('for more information, check project repo https://github.com/rafael-adcp/geek-lab')
  //this will force "cli" to show help when nothing is provided
  .demandCommand(1, '')
  //pretty printing things following to terminal width
  .wrap(cli.terminalWidth())
  .parse();
