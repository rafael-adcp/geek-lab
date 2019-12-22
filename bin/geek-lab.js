#!/usr/bin/env node
const path = require('path');
const updateNotifier = require('update-notifier');
const toString = require('lodash/toString');
const isEmpty = require('lodash/isEmpty');
const isEqual = require('lodash/isEqual');
const filter = require('lodash/filter');

const yargs = require('yargs');
const recursiveReadSync = require('recursive-readdir-sync');

function commandExists(command, listCommands){
  const filtered = filter(listCommands, function(o) { return isEqual(o.command, command); });

  //checking if the command already exists
  return isEqual(filtered.length, 0) ? false : true;
}

const pkg = require(path.join(__dirname, '../package.json'));

updateNotifier({ pkg, updateCheckInterval: 1000 }).notify();

const actionsPath = path.join(__dirname, '../src/actions');

const files = recursiveReadSync(actionsPath);

const actionsDetails = [];

// reading default actions from cli
for(const file of files) {
  const action = require(file);

  if(commandExists(action.command, actionsDetails)){
    console.log(
      `Duplicate command provided, commands should be unique!
      command "${action.command}"
      from ${file}
      already exists
      it was originally added from: ${actionsDetails[action.command]}`
    );
    throw new Error('Duplicate command provided');

  } else {
    actionsDetails.push({
      command: action.command,
      path: file,
    });
    /*
      we cant use
      .commandDir(rootPath, { recurse: true }) because we need to know all the commands to prevent
      command colisions
    */
    yargs
      .command(action);
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
  !commandExists(provided, actionsDetails) //if command donot exist
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