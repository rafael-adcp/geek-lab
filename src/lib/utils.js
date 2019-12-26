const path = require('path');
const fs = require('fs');
const moment = require('moment');
const isEmpty = require('lodash/isEmpty');

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

  readConfig(){
    return UTILS.readInternalCliFile('config_geek-lab.json');
  },

  collectMetrics(command){

    //allowing the user to opt in / out from metrics, default is false
    if(this.readConfig().collectMetrics){

      // when the cli is called without params, just to prevent metrics to add ""
      command = isEmpty(command) ? 'geek-lab' : command;

      const fileName = 'metrics_geek-lab.json';
      const metricsFileContent = UTILS.readInternalCliFile(fileName);

      if(!metricsFileContent.totalUsage[command]) {
      //creating entry for command if not there yet
        metricsFileContent.totalUsage[command] = 0;
      }

      //increasing total usage of command
      metricsFileContent.totalUsage[command]++;

      const currentDate = moment(new Date()).format('DD/MM/YYYY');

      // creating entry for date if not there yet
      if(!metricsFileContent.dailyUsage[currentDate]) {
        metricsFileContent.dailyUsage[currentDate] = {};
      }

      //checking if theres an entry for command for that date
      if(!metricsFileContent.dailyUsage[currentDate][command]){
        metricsFileContent.dailyUsage[currentDate][command] = 0;
      }
      metricsFileContent.dailyUsage[currentDate][command]++;

      UTILS.writeInternalCliFile(
        fileName,
        metricsFileContent
      );
    }
  },
};

module.exports = UTILS;