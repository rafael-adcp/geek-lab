#!/usr/bin/env node
const path = require('path');
const updateNotifier = require('update-notifier');
const toString = require('lodash/toString');
const isEmpty = require('lodash/isEmpty');
const isEqual = require('lodash/isEqual');
const findIndex = require('lodash/findIndex');
const yargs = require('yargs');
const recursiveReadSync = require('recursive-readdir-sync');

const pkg = require(path.join(__dirname, '../package.json'));

updateNotifier({ pkg, updateCheckInterval: 1000 }).notify();

const actionsPath = path.join(__dirname, '../src/actions')

const files = recursiveReadSync(actionsPath);

const actionNames = [];

// reading default actions from cli
for(const file of files) {
  const action = require(file)

  //TODO: handle colision
  actionNames.push(action.command);
  /*
    we cant use
    .commandDir(rootPath, { recurse: true }) because we need to know all the commands to prevent
    command colisions
  */
  yargs
    .command(action)
}

const provided = toString(
  Array.prototype.slice.call(process.argv, 2)[0]
);

const commandIndex = findIndex(actionNames, function(o) { return isEqual(o, provided) })
const commandExist =  isEqual(commandIndex, -1) ? false : true;

//showing cli tool help when an invalid command is provided
if (
  !isEmpty(provided) &&
  provided !== '--help' && //yargs default param to show help
  provided !== '--version' && //yargs default param to show version
  !commandExist //if command donot exist
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