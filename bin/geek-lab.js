#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const os = require('os');
const axios = require('axios');
const mysql2 = require('mysql2/promise');

const toString = require('lodash/toString');
const isEmpty = require('lodash/isEmpty');
const find = require('lodash/find');
const union = require('lodash/union');

const yargs = require('yargs');

const paths = require('../src/utils/paths');
const clock = require('../src/utils/clock');
const config = require('../src/utils/config');
const metrics = require('../src/utils/metrics');
const httpUtil = require('../src/utils/http');
const mysqlUtil = require('../src/utils/mysql');
const actionsUtil = require('../src/utils/actions');

const pkg = require(path.join(__dirname, '../package.json'));

// update-notifier is ESM-only since v6; fire-and-forget via dynamic import
// so the rest of the CLI stays CJS and boots synchronously.
/* istanbul ignore next: advisory side-effect, not a code path under test */
import('update-notifier')
  .then(({ default: updateNotifier }) => updateNotifier({ pkg, updateCheckInterval: 1000 }).notify())
  .catch(() => { /* advisory check — never block the CLI */ });

const configPath = paths.internalFile(os, 'config_geek-lab.json');
const metricsPath = paths.internalFile(os, 'metrics_geek-lab.json');

const readConfig = () => config.readConfig(fs, configPath);
const resolveConfigValue = (key) => config.resolveValue(readConfig(), key);
const writeConfig = (data) => fs.writeFileSync(configPath, JSON.stringify(data, null, '  '));

const httpClient = httpUtil.createHttpClient({
  axios,
  fs,
  getToken: () => readConfig().token,
  getBaseUrl: () => resolveConfigValue('apiUrl'),
});

const mysqlClient = mysqlUtil.createMysqlClient({
  mysql2,
  getCreds: /* istanbul ignore next: only fires when an action calls deps.mysql.query against
     a real DB; mysql actions are unit-tested with an injected mysql.query stub. */ () => ({
    host: resolveConfigValue('mysqlHost'),
    user: resolveConfigValue('mysqlUser'),
    password: resolveConfigValue('mysqlPassword'),
  }),
});

const customActionsPath = () => {
  const configured = readConfig().customActionsPath;
  return isEmpty(configured) ? [] : configured;
};

const readMetrics = () => JSON.parse(fs.readFileSync(metricsPath, 'utf8'));

const recordMetrics = (command) => {
  if (!readConfig().collectMetrics) return;
  const normalized = isEmpty(command) ? 'geek-lab' : command;
  const updated = metrics.recordUsage({ store: readMetrics(), clock, command: normalized });
  fs.writeFileSync(metricsPath, JSON.stringify(updated, null, '  '));
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

const actions = actionsUtil.discoverActions({
  fs,
  pathLib: path,
  loader: require,
  dirs: union([paths.defaultActionsPath()], customActionsPath()),
  deps,
});

for (const action of actions) {
  /*
    we cant use
    .commandDir(rootPath, { recurse: true }) because we need to know all the commands to prevent
    command colisions
  */
  yargs
    .command(action);
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
  yargs.showHelp();
} else {
  //preventing invalid actions to be stored on metrics
  recordMetrics(provided);
}

yargs
  //apending a message at the botton of help command
  .epilogue('for more information, check project repo https://github.com/rafael-adcp/geek-lab')
  //this will force "cli" to show help when nothing is provided
  .demandCommand(1, '')
  //pretty printing things following to terminal width
  .wrap(yargs.terminalWidth())
  .argv;
