import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import http from 'http';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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

export function createCliEnv({ config = {}, metrics = DEFAULT_METRICS } = {}) {
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

  function run(args = [], extraEnv = {}) {
    const argv = Array.isArray(args) ? args : String(args).split(' ').filter(Boolean);
    return new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [BIN_PATH, ...argv], {
        cwd: home,
        env: { ...process.env, HOME: home, USERPROFILE: home, ...extraEnv },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      child.stdout.on('data', (c) => { stdout += c.toString('utf8'); });
      child.stderr.on('data', (c) => { stderr += c.toString('utf8'); });
      const killer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, 10000);
      child.on('exit', (status, signal) => {
        clearTimeout(killer);
        if (timedOut) {
          reject(new Error(
            `CLI invocation timed out after 10s: ${argv.join(' ')}\n` +
            `--- stdout ---\n${stdout}\n--- stderr ---\n${stderr}`
          ));
          return;
        }
        resolve({ stdout, stderr, status, signal });
      });
    });
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

export function writeMysqlShim(home, { rows = [], fields = [] } = {}) {
  const shimPath = path.join(home, 'mysql2-shim.mjs');
  const logPath = path.join(home, 'mysql2-shim.log');
  fs.writeFileSync(
    shimPath,
    `import fs from 'fs';
const log = (entry) => fs.appendFileSync(${JSON.stringify(logPath)}, JSON.stringify(entry) + '\\n');
export default {
  async createConnection(creds) {
    log({ event: 'connect', creds });
    return {
      async execute(sql) {
        log({ event: 'execute', sql });
        return [${JSON.stringify(rows)}, ${JSON.stringify(fields)}];
      },
      async destroy() { log({ event: 'destroy' }); },
    };
  },
};
`
  );
  return {
    shimPath,
    readLog: () => fs.readFileSync(logPath, 'utf8')
      .split('\n').filter(Boolean).map((l) => JSON.parse(l)),
  };
}

export function startHttpServer(handler) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        res.setHeader('Connection', 'close');
        handler(req, res, body);
      });
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        port,
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((r) => {
          server.close(r);
          server.closeAllConnections();
        }),
      });
    });
  });
}
