const path = require('path');
const fs = require('fs');
const moment = require('moment');
const axios = require('axios');
const recursiveReadSync = require('recursive-readdir-sync');
const _ = require('lodash');

const UTILS = {
  getUserDirectory() {
    const homePath = require('os').homedir();
    return path.join(`${homePath}/geek-lab_local`);
  },

  readInternalCliFile(fileName) {
    const homePath = UTILS.getUserDirectory();
    const filePath = `${homePath}/${fileName}`;
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.log('Something went wrong, either it couldnt find the file, or its failing to parse it as json');
      console.log(`Could not find folder or file ${filePath}`);
      console.log(`Debug instructions:
      - check file for invalid characters
      - install the tool again and it will generate everything you need if missing something`);
      console.log(e);
      throw new Error('Failed to read file');
    }
  },

  writeInternalCliFile(fileName, data) {
    const homePath = UTILS.getUserDirectory();
    const filePath = `${homePath}/${fileName}`;
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, '  '));
    } catch (e) {
      console.log(`something went wrong while attempting to write file ${filePath}`);
      console.log(e);
      throw new Error(`Failed to write file ${filePath}`);

    }
  },

  readConfig() {
    return UTILS.readInternalCliFile('config_geek-lab.json');
  },

  collectMetrics(command) {

    //allowing the user to opt in / out from metrics
    if (UTILS.readConfig().collectMetrics) {

      // when the cli is called without params, just to prevent metrics to add ""
      command = _.isEmpty(command) ? 'geek-lab' : command;

      const fileName = 'metrics_geek-lab.json';
      const metricsFileContent = UTILS.readInternalCliFile(fileName);

      if (!metricsFileContent.totalUsage[command]) {
        //creating entry for command if not there yet
        metricsFileContent.totalUsage[command] = 0;
      }

      //increasing total usage of command
      metricsFileContent.totalUsage[command]++;

      const currentDate = moment(new Date()).format('DD/MM/YYYY');

      // creating entry for date if not there yet
      if (!metricsFileContent.dailyUsage[currentDate]) {
        metricsFileContent.dailyUsage[currentDate] = {};
      }

      //checking if theres an entry for command for that date
      if (!metricsFileContent.dailyUsage[currentDate][command]) {
        metricsFileContent.dailyUsage[currentDate][command] = 0;
      }
      metricsFileContent.dailyUsage[currentDate][command]++;

      UTILS.writeInternalCliFile(
        fileName,
        metricsFileContent
      );
    }
  },

  getConfigValue(key) {
    const configFile = UTILS.readConfig();
    const currentEnv = configFile.env;
    if (_.isEmpty(currentEnv)) {
      throw new Error('Invalid env for cli');
    } else if (_.isEmpty(configFile[currentEnv])) {
      throw new Error(`Environment ${currentEnv} is not set on config file.`);
    } else if (!configFile[currentEnv][key] && _.isEmpty(configFile[currentEnv][key])) {
      throw new Error(`Key "${key}" is not set for environment "${currentEnv}"`);
    }
    return configFile[currentEnv][key];
  },

  async performRequest(params) {

    if (_.isEmpty(params)) {
      throw new Error('No params were provided');
    }
    const method = params.method || null;
    let endpoint = params.endpoint || null;

    let data;
    if (!_.isEmpty(params.data)) {
      data = _.startsWith(params.data, '@') ? fs.readFileSync(params.data.replace('@', ''), 'utf8') : params.data;
    }

    if (!method || !endpoint) {
      console.log('provided information:');
      console.log(`method: ${method}`);
      console.log(`endpoint: ${endpoint}`);
      throw new Error(`To perform a request you must provide at least a method and an endpoint`);
    }

    if (!['POST', 'GET', 'DELETE', 'PUT'].includes(method.toUpperCase())) {
      console.log(`provided: ${method.toUpperCase()}`);
      throw new Error('Invalid method provided');
    }

    //preventing double "/""
    endpoint = _.startsWith(params.endpoint, '/') ? params.endpoint : `/${params.endpoint}`;

    const res = await axios({
      method: method.toUpperCase(),
      url: UTILS.getConfigValue('apiUrl') + endpoint,
      json: true,
      headers: {
        'Content-Type': 'application/json',
      },
      data: data,
    });

    const response = await res.data;
    return response;
  },

  getActions() {
    const defaultActionsPath = path.join(__dirname, '../actions');

    let actionsPath = [defaultActionsPath];

    const customActionsPath = UTILS.readConfig().customActionsPath;

    actionsPath = _.union(
      actionsPath,
      _.isEmpty(customActionsPath) ? [] : customActionsPath
    );

    let files = [];
    for (const action of actionsPath) {
      files = _.union(
        files,
        recursiveReadSync(action)
      );
    }

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
};

module.exports = UTILS;