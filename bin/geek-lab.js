#!/usr/bin/env node
const path = require('path');
const updateNotifier = require('update-notifier');
const toString = require('lodash/toString');
const isEmpty = require('lodash/isEmpty');
const find = require('lodash/find');

const yargs = require('yargs');
const UTILS = require('../src/lib/utils');

const pkg = require(path.join(__dirname, '../package.json'));

updateNotifier({ pkg, updateCheckInterval: 1000 }).notify();

const actions = UTILS.getAllActions();

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
  UTILS.collectMetrics(provided);
}

yargs
  //apending a message at the botton of help command
  .epilogue('for more information, check project repo https://github.com/rafael-adcp/geek-lab')
  //this will force "cli" to show help when nothing is provided
  .demandCommand(1, '')
  //pretty printing things following to terminal width
  .wrap(yargs.terminalWidth())
  .argv;