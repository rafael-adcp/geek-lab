const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');

const BIN_PATH = path.resolve(__dirname, '../../bin/geek-lab.js');

const DEFAULT_CONFIG = {
  env: 'dev',
  debugMode: false,
  collectMetrics: true,
  token: null,
  tokenExpires: null,
  customActionsPath: [],
  dev: {
    apiUrl: 'http://127.0.0.1:1',
    apiAuthenticationExpiresInMinutes: 120,
    apiAuthenticationEndpoint: '/auth',
    apiTokenResponseField: 'token',
    apiAuthenticationJson: { auth: { username: 'aaa', password: 'bbb' } },
    mysqlHost: 'localhost',
    mysqlUser: 'u',
    mysqlPassword: 'p',
  },
};

const DEFAULT_METRICS = { totalUsage: {}, dailyUsage: {} };

function createCliEnv({ config = {}, metrics = DEFAULT_METRICS } = {}) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'glab-e2e-'));
  const geekDir = path.join(home, 'geek-lab_local');
  fs.mkdirSync(geekDir);
  const configPath = path.join(geekDir, 'config_geek-lab.json');
  const metricsPath = path.join(geekDir, 'metrics_geek-lab.json');

  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  if (config.dev) {
    mergedConfig.dev = { ...DEFAULT_CONFIG.dev, ...config.dev };
  }

  fs.writeFileSync(configPath, JSON.stringify(mergedConfig, null, 2));
  fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));

  function run(args = []) {
    const argv = Array.isArray(args) ? args : String(args).split(' ').filter(Boolean);
    const result = spawnSync(process.execPath, [BIN_PATH, ...argv], {
      env: { ...process.env, HOME: home, USERPROFILE: home },
      encoding: 'utf8',
    });
    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      status: result.status,
    };
  }

  function readConfig() {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  function readMetrics() {
    return JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
  }

  function writeConfig(next) {
    fs.writeFileSync(configPath, JSON.stringify(next, null, 2));
  }

  function cleanup() {
    fs.rmSync(home, { recursive: true, force: true });
  }

  return {
    home,
    geekDir,
    configPath,
    metricsPath,
    run,
    readConfig,
    readMetrics,
    writeConfig,
    cleanup,
  };
}

function startHttpServer(handler) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        handler(req, res, body);
      });
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        port,
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((r) => server.close(r)),
      });
    });
  });
}

module.exports = { createCliEnv, startHttpServer };
