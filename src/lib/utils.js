const path = require('path');
const fs = require('fs');
const os = require('os');
const axios = require('axios');
const _ = require('lodash');
const mysql2 = require('mysql2/promise');

const paths = require('../utils/paths');
const clock = require('../utils/clock');
const config = require('../utils/config');
const metrics = require('../utils/metrics');
const http = require('../utils/http');
const mysql = require('../utils/mysql');
const actions = require('../utils/actions');

const UTILS = {
  getUserDirectory() {
    return paths.userDirectory(os);
  },

  readInternalCliFile(fileName) {
    const filePath = paths.internalFile(os, fileName);
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.log('Something went wrong, either it couldnt find the file, or its failing to parse it as json');
      console.log(`Could not find folder or file ${filePath}`);
      console.log(`Debug instructions:
      - check file for invalid characters
      - install the tool again and it will generate everything you need if missing something`);
      console.log(e);
      throw new Error('Failed to read file', { cause: e });
    }
  },

  writeInternalCliFile(fileName, data) {
    const filePath = paths.internalFile(os, fileName);
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, '  '));
    } catch (e) {
      console.log(`something went wrong while attempting to write file ${filePath}`);
      console.log(e);
      throw new Error(`Failed to write file ${filePath}`, { cause: e });

    }
  },

  readConfig() {
    return config.readConfig(fs, paths.internalFile(os, 'config_geek-lab.json'));
  },

  readMetricsFile() {
    return UTILS.readInternalCliFile('metrics_geek-lab.json');
  },

  collectMetrics(command) {
    if (!UTILS.readConfig().collectMetrics) return;

    // when the cli is called without params, just to prevent metrics to add ""
    const normalized = _.isEmpty(command) ? 'geek-lab' : command;

    const updated = metrics.recordUsage({
      store: UTILS.readMetricsFile(),
      clock,
      command: normalized,
    });

    UTILS.writeInternalCliFile('metrics_geek-lab.json', updated);
  },

  getConfigValue(key) {
    return config.resolveValue(UTILS.readConfig(), key);
  },

  async performRequest(params) {
    // eslint-disable-next-line no-use-before-define -- httpClient is constructed below to close over UTILS
    return httpClient.request(params);
  },

  getActionsFromPath(dirs) {
    return actions.listFiles({ fs, pathLib: path, dirs });
  },

  getDefaultActionsPath() {
    return paths.defaultActionsPath();
  },

  getCustomActionsPath() {
    return _.isEmpty(UTILS.readConfig().customActionsPath)
      ? [] : UTILS.readConfig().customActionsPath;
  },

  getAllActions() {
    return actions.discoverActions({
      fs,
      pathLib: path,
      loader: require,
      dirs: _.union([UTILS.getDefaultActionsPath()], UTILS.getCustomActionsPath()),
    });
  },

  async performMySQLQuery(query) {
    // eslint-disable-next-line no-use-before-define -- mysqlClient is constructed below to close over UTILS
    return mysqlClient.query(query);
  },
};

const httpClient = http.createHttpClient({
  axios,
  fs,
  getToken: () => UTILS.readConfig().token,
  getBaseUrl: () => UTILS.getConfigValue('apiUrl'),
});

const mysqlClient = mysql.createMysqlClient({
  mysql2,
  getCreds: () => ({
    host: UTILS.getConfigValue('mysqlHost'),
    user: UTILS.getConfigValue('mysqlUser'),
    password: UTILS.getConfigValue('mysqlPassword'),
  }),
});

module.exports = UTILS;