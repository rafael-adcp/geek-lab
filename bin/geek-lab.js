#!/usr/bin/env node
const path = require('path');
const updateNotifier = require('update-notifier');
const toString = require('lodash/toString');
const isEmpty = require('lodash/isEmpty');
const isEqual = require('lodash/isEqual');
const findIndex = require('lodash/findIndex');
const yargs = require('yargs');
const recursiveReadSync = require('recursive-readdir-sync');

function commandExists(command, listCommands){
  const commandIndex = findIndex(listCommands, function(o) { return isEqual(o, command) })
  const commandExist =  isEqual(commandIndex, -1) ? false : true;
  return commandExist;
}

const pkg = require(path.join(__dirname, '../package.json'));

updateNotifier({ pkg, updateCheckInterval: 1000 }).notify();

const actionsPath = path.join(__dirname, '../src/actions')

const files = recursiveReadSync(actionsPath);

const actionNames = []; // todo: maybe get rid of this guy since we already store thigns in \/?
const actionsDetails = {};

// reading default actions from cli
for(const file of files) {
  const action = require(file)

  if(commandExists(action.command, actionNames)){
    console.log(
      `Duplicate command provided, commands should be unique!
      command "${action.command}"
      from ${file}
      already exists
      it was originally added from: ${actionsDetails[action.command]}`
    )
    throw new Error('Duplicate command provided')

  } else {
    actionNames.push(action.command);
    actionsDetails[action.command] = file;
    /*
      we cant use
      .commandDir(rootPath, { recurse: true }) because we need to know all the commands to prevent
      command colisions
    */
    yargs
      .command(action)
  }
}

const provided = toString(
  Array.prototype.slice.call(process.argv, 2)[0]
);

//showing cli tool help when an invalid command is provided
if (
  !isEmpty(provided) &&
  provided !== '--help' && //yargs default param to show help
  provided !== '--version' && //yargs default param to show version
  !commandExist(provided, actionNames) //if command donot exist
) {
  console.log(`Invalid command provided "${provided}", see available options below`);
  yargs.showHelp();
}

yargs
  //apending a message at the botton of help command
  .epilogue('for more information, check project repo https://github.com/rafael-adcp/geek-lab')
  //this will force "cli" to show help when nothing is provided
  .demandCommand(1, '')
  //pretty printing things following to terminal width
  .wrap(yargs.terminalWidth())
  .argv;