/**
 * exporting command to execute cli via node so that tests can be executed via GitHub Actions
 */
module.exports = `node "${require('path').resolve(__dirname, '../bin/geek-lab.js')}"`;