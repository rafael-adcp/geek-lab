const path = require('path');
const fs = require('fs');
const moment = require('moment');
const isEmpty = require('lodash/isEmpty');
const axios = require('axios');
const startsWith = require('lodash/startsWith');

const UTILS = {
  getUserDirectory() {
    const homePath = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
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
      command = isEmpty(command) ? 'geek-lab' : command;

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

    if (isEmpty(currentEnv)) {
      throw new Error('Invalid env for cli');
    } else if (isEmpty(configFile[currentEnv])) {
      throw new Error(`Environment ${currentEnv} is not set on config file.`);
    } else if (isEmpty(configFile[currentEnv][key])) {
      throw new Error(`Key "${key}" is not set for environment "${currentEnv}"`);
    }
    return configFile[currentEnv][key];
  },

  async performRequest(params) {

    if (isEmpty(params)) {
      throw new Error('No params were provided');
    }
    const method = params.method || null;
    let endpoint = params.endpoint || null;

    let data;
    if (!isEmpty(params.data)) {
      data = startsWith(params.data, '@') ? fs.readFileSync(params.data.replace('@', ''), 'utf8') : params.data;
      //ensuring we have valid json DATA
      JSON.parse(data);
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
    endpoint = startsWith(params.endpoint, '/') ? params.endpoint : `/${params.endpoint}`;

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

    if (!response) {
      console.log(response);
      throw new Error(`Something went wrong while making the request ${response}`);
    }
    return response;
  },
};

module.exports = UTILS;