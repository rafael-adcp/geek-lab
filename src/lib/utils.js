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

  getActionsFromPath(paths) {
    let files = [];
    for (const actionPath of paths) {
      const entries = fs.readdirSync(actionPath, { recursive: true, withFileTypes: true });
      const filePaths = entries
        .filter((entry) => entry.isFile())
        .map((entry) => path.join(entry.parentPath, entry.name));
      files = _.union(files, filePaths);
    }
    return files;
  },

  getDefaultActionsPath() {
    return paths.defaultActionsPath();
  },

  getCustomActionsPath() {
    return _.isEmpty(UTILS.readConfig().customActionsPath)
      ? [] : UTILS.readConfig().customActionsPath;
  },

  getAllActions() {
    const defaultActionsPath = UTILS.getDefaultActionsPath();
    const defaultActions = UTILS.getActionsFromPath([
      defaultActionsPath,
    ]);

    const customActions = UTILS.getActionsFromPath(
      UTILS.getCustomActionsPath()
    );

    const files = _.union(
      defaultActions,
      customActions
    );

    const actionsDetails = [];
    const finalActions = [];

    // reading default actions from cli
    for (const file of files) {
      const action = require(file);
      finalActions.push(action);
      const filtered = _.find(actionsDetails, (o) => { return _.isEqual(o.command, action.command); });

      //checking if the command already exists
      const commandExists = filtered ? true : false;

      if (commandExists) {
        console.log(
          `Duplicate command provided, commands should be unique!
          command "${action.command}"
          from ${file}
          already exists
          it was originally added from: ${filtered.path}`
        );
        throw new Error('Duplicate command provided');

      } else {
        actionsDetails.push({
          command: action.command,
          path: file,
        });
      }
    }
    return finalActions;
  },

  async performMySQLQuery(query) {
    const connection = await mysql2.createConnection({
      host: UTILS.getConfigValue('mysqlHost'),
      user: UTILS.getConfigValue('mysqlUser'),
      password: UTILS.getConfigValue('mysqlPassword'),
    });

    const [rows, fields] = await connection.execute(query);

    await connection.destroy();

    return {
      rows: Object.values(
        JSON.parse(
          JSON.stringify(
            rows
          )
        )
      ),
      fields: fields,
    };
  },
};

const httpClient = http.createHttpClient({
  axios,
  fs,
  getToken: () => UTILS.readConfig().token,
  getBaseUrl: () => UTILS.getConfigValue('apiUrl'),
});

module.exports = UTILS;