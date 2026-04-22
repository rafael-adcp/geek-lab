const path = require('path');

function userDirectory(os) {
  return path.join(os.homedir(), 'geek-lab_local');
}

function internalFile(os, fileName) {
  return path.join(userDirectory(os), fileName);
}

function defaultActionsPath() {
  return path.join(__dirname, '../actions');
}

module.exports = { userDirectory, internalFile, defaultActionsPath };
