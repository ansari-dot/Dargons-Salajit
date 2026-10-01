#!/usr/bin/env node
/**
 * Project-local MySQL-compatible database manager (portable MariaDB).
 *
 * The API needs a MySQL server on DB_HOST:DB_PORT (see server/.env). When no
 * MySQL/MariaDB is installed on the machine this script provisions a portable
 * copy inside `server/.localdb` and runs it as a normal user process — no
 * Windows service, no admin rights, nothing installed system-wide.
 *
 * Usage:
 *   node scripts/localDb.cjs ensure   (default) start it if it is not running
 *   node scripts/localDb.cjs start    download + initialise + start
 *   node scripts/localDb.cjs stop     shut the server down
 *   node scripts/localDb.cjs status   show whether it is reachable
 *   node scripts/localDb.cjs remove   delete the .localdb folder (and its data)
 *
 * `npm run dev` / `npm start` call `ensure` first, so the API always has a DB.
 */

const fs = require('fs');
const path = require('path');
const net = require('net');
const { spawn, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DB_DIR = path.join(ROOT, '.localdb');
const ARCHIVE = path.join(DB_DIR, 'mariadb.zip');
const SERVER_DIR = path.join(DB_DIR, 'server');
const DATA_DIR = path.join(DB_DIR, 'data');
const INI_FILE = path.join(DB_DIR, 'my.ini');
const LOG_FILE = path.join(DB_DIR, 'mysqld.log');
const PID_FILE = path.join(DB_DIR, 'mysqld.pid');

const MARIA_VERSION = '10.11.9';
const DOWNLOAD_URLS = [
  `https://archive.mariadb.org/mariadb-${MARIA_VERSION}/winx64-packages/mariadb-${MARIA_VERSION}-winx64.zip`,
  `https://downloads.mariadb.com/MariaDB/mariadb-${MARIA_VERSION}/winx64-packages/mariadb-${MARIA_VERSION}-winx64.zip`,
];

// ── .env values (the API reads the same file) ────────────────────────────────
require('dotenv').config({ path: path.join(ROOT, '.env'), quiet: true });
const RAW_HOST = (process.env.DB_HOST || 'localhost').trim();
const HOST = RAW_HOST === 'localhost' ? '127.0.0.1' : RAW_HOST;
const PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'sl';
const IS_LOCAL = ['127.0.0.1', '::1'].includes(HOST) || HOST.toLowerCase() === 'localhost';

const log = (msg) => console.log(`[localDb] ${msg}`);
const die = (msg) => {
  console.error(`[localDb] ${msg}`);
  process.exit(1);
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fileExists = (p) => {
  try {
    return fs.existsSync(p);
  } catch (e) {
    return false;
  }
};

const findFile = (dir, fileName) => {
  if (!fileExists(dir)) return null;
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch (e) {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name.toLowerCase() === fileName.toLowerCase()) return full;
    }
  }
  return null;
};

const run = (exe, args, options = {}) =>
  spawnSync(exe, args, { encoding: 'utf8', windowsHide: true, ...options });

const spawnDetached = (exe, args, cwd) => {
  const out = fs.openSync(LOG_FILE, 'a');
  // `--console` keeps mysqld attached to this process on Windows instead of
  // letting it detach into an orphaned background service-style process.
  const child = spawn(exe, [...args, '--console'], {
    cwd,
    detached: true,
    windowsHide: true,
    stdio: ['ignore', out, out],
  });
  child.unref();
  return child.pid;
};

/**
 * Kills mysqld processes that belong to this project (server/.localdb only), so
 * a half-initialised or orphaned instance can never block the port for good.
 */
const ownMysqldPids = () => {
  const script =
    `Get-CimInstance Win32_Process -Filter "Name='mysqld.exe'" | ` +
    `Where-Object { $_.ExecutablePath -like '${DB_DIR}*' } | ` +
    'ForEach-Object { $_.ProcessId }';
  const result = run('powershell.exe', ['-NoProfile', '-Command', script]);
  return String(result.stdout || '')
    .split(/\s+/)
    .map((value) => value.trim())
    .filter((value) => /^\d+$/.test(value));
};

const killOwnMysqld = () => {
  const pids = ownMysqldPids();
  for (const pid of pids) {
    run('taskkill', ['/PID', pid, '/F']);
    log(`stopped leftover mysqld process ${pid}`);
  }
  return pids.length;
};

const isPortOpen = (host, port, timeoutMs = 1500) =>
  new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });

const waitForPort = async (port, timeoutMs = 90000) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await isPortOpen(HOST, port)) return true;
    await sleep(1000);
  }
  return false;
};

const mysqlClient = () => {
  try {
    return require('mysql2/promise');
  } catch (e) {
    die('mysql2 is not installed. Run `npm install` inside the server folder first.');
  }
};

const connect = (withDatabase = true) =>
  mysqlClient().createConnection({
    host: HOST,
    port: PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    ...(withDatabase ? { database: DB_NAME } : {}),
    connectTimeout: 8000,
  });

const isReachable = async () => {
  try {
    const connection = await connect(false);
    await connection.query('SELECT 1');
    await connection.end();
    return true;
  } catch (e) {
    return false;
  }
};

// ── Provisioning (download → extract → initialise → start) ───────────────────
const fail = (message) => {
  throw new Error(message);
};

const download = async () => {
  if (fileExists(ARCHIVE)) {
    log(`archive already downloaded (${(fs.statSync(ARCHIVE).size / 1048576).toFixed(1)} MB)`);
    return;
  }
  fs.mkdirSync(DB_DIR, { recursive: true });

  let lastError = null;
  for (const url of DOWNLOAD_URLS) {
    try {
      log(`downloading portable MariaDB ${MARIA_VERSION} (~90 MB, one time only)...`);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(ARCHIVE, buffer);
      log(`downloaded ${(buffer.length / 1048576).toFixed(1)} MB`);
      return;
    } catch (error) {
      lastError = error;
      log(`download failed: ${error.message}`);
    }
  }
  fail(`could not download MariaDB (${lastError ? lastError.message : 'unknown error'}). Install MySQL manually or check your connection.`);
};

const extract = () => {
  if (findFile(SERVER_DIR, 'mysqld.exe')) {
    log('portable server files already extracted');
    return;
  }
  fs.mkdirSync(SERVER_DIR, { recursive: true });
  log('extracting...');

  // Windows 10+ ships bsdtar which understands zip archives
  const tarResult = run('tar', ['-xf', ARCHIVE, '-C', SERVER_DIR]);
  if (tarResult.status === 0 && findFile(SERVER_DIR, 'mysqld.exe')) return;

  run('powershell.exe', [
    '-NoProfile',
    '-Command',
    `Expand-Archive -LiteralPath '${ARCHIVE}' -DestinationPath '${SERVER_DIR}' -Force`,
  ]);
  if (!findFile(SERVER_DIR, 'mysqld.exe')) fail('could not extract the MariaDB archive.');
};

const writeIni = (mysqldDir) => {
  const ini = [
    '[mysqld]',
    `basedir=${path.dirname(mysqldDir).replace(/\\/g, '/')}`,
    `datadir=${DATA_DIR.replace(/\\/g, '/')}`,
    `port=${PORT}`,
    `bind-address=${HOST}`,
    `log-error=${LOG_FILE.replace(/\\/g, '/')}`,
    `pid-file=${PID_FILE.replace(/\\/g, '/')}`,
    'max_connections=50',
    'character-set-server=utf8mb4',
    '',
    '[client]',
    'default-character-set=utf8mb4',
    `host=${HOST}`,
    `port=${PORT}`,
    '',
  ].join('\r\n');
  fs.writeFileSync(INI_FILE, ini);
};

const isInitialised = () => fileExists(path.join(DATA_DIR, 'mysql'));

const initialise = (mysqldDir) => {
  if (isInitialised()) {
    log('data directory already initialised');
    return;
  }

  // A previous failed attempt can leave a partial data directory behind and the
  // installer refuses to work on a non-empty one → always start from clean.
  if (fileExists(DATA_DIR)) {
    log('clearing a partial data directory...');
    fs.rmSync(DATA_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  log('initialising the data directory...');

  // MariaDB ships mysql_install_db.exe on Windows (it also sets the root password)
  const installTool = findFile(SERVER_DIR, 'mysql_install_db.exe');
  if (installTool) {
    const result = run(installTool, [
      `--datadir=${DATA_DIR}`,
      `--port=${PORT}`,
      `--password=${DB_PASSWORD}`,
      '--silent',
    ]);
    if (isInitialised()) {
      log('data directory ready');
      return;
    }
    log(`mysql_install_db failed: ${(result.stderr || result.stdout || '').trim().split('\n').slice(-3).join(' ')}`);
  }

  // MySQL-style server fallback: initialise with an empty root password, which
  // ensureDatabaseAndUser() then replaces with the DB_PASSWORD from .env
  const mysqld = findFile(SERVER_DIR, 'mysqld.exe');
  const fallback = run(mysqld, [`--defaults-file=${INI_FILE}`, '--initialize-insecure', '--console']);
  if (!isInitialised()) {
    log(`mysqld --initialize-insecure failed: ${(fallback.stderr || fallback.stdout || '').trim().split('\n').slice(-3).join(' ')}`);
    fail(`initialisation failed — see ${LOG_FILE}`);
  }
  log('data directory ready');
};

const startMysqld = () => {
  const mysqld = findFile(SERVER_DIR, 'mysqld.exe');
  if (!mysqld) fail('mysqld.exe is missing — run `node scripts/localDb.cjs start` again to re-download.');
  const mysqldDir = path.dirname(mysqld);

  writeIni(mysqldDir);
  initialise(mysqldDir);

  log(`starting mysqld on ${HOST}:${PORT} ...`);
  const pid = spawnDetached(mysqld, [`--defaults-file=${INI_FILE}`], mysqldDir);
  fs.writeFileSync(PID_FILE, String(pid));
};

// ── Database / user bootstrap ────────────────────────────────────────────────
const sqlString = (value) => `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

const ensureDatabaseAndUser = async () => {
  // Preferred path: the credentials in server/.env already work
  try {
    const connection = await connect(false);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);

    // Also cover the literal TCP host in case name resolution is switched off
    try {
      const scope = DB_USER === 'root' ? '*.*' : `\`${DB_NAME}\`.*`;
      await connection.query(
        `CREATE USER IF NOT EXISTS '${DB_USER}'@'127.0.0.1' IDENTIFIED BY ${sqlString(DB_PASSWORD)}`
      );
      await connection.query(`GRANT ALL PRIVILEGES ON ${scope} TO '${DB_USER}'@'127.0.0.1'`);
      await connection.query('FLUSH PRIVILEGES');
    } catch (grantError) {
      // The 'localhost' account already covers this connection
    }

    await connection.end();
    log(`database '${DB_NAME}' is ready`);
    return;
  } catch (error) {
    if (error.code !== 'ER_ACCESS_DENIED_ERROR') {
      fail(`could not connect to the database: ${error.message}`);
    }
  }

  // Fresh data directory → configure the credentials taken from server/.env
  log('configuring the database credentials from server/.env ...');
  const connection = await mysqlClient().createConnection({
    host: HOST,
    port: PORT,
    user: DB_USER,
    password: '',
    connectTimeout: 8000,
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    if (DB_USER === 'root') {
      await connection.query(`ALTER USER 'root'@'localhost' IDENTIFIED BY ${sqlString(DB_PASSWORD)}`);
      await connection.query(
        `CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED BY ${sqlString(DB_PASSWORD)}`
      );
      await connection.query(`GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION`);
      await connection.query('FLUSH PRIVILEGES');
    } else {
      await connection.query(
        `CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY ${sqlString(DB_PASSWORD)}`
      );
      await connection.query(`GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost'`);
      await connection.query('FLUSH PRIVILEGES');
    }
  } finally {
    await connection.end().catch(() => {});
  }

  const check = await connect(false);
  await check.query('SELECT 1');
  await check.end();
  log(`database '${DB_NAME}' is ready (user '${DB_USER}')`);
};

// ── Commands ─────────────────────────────────────────────────────────────────
const status = async () => {
  if (!(await isPortOpen(HOST, PORT))) {
    log(`no database server is listening on ${HOST}:${PORT}`);
    return false;
  }
  if (await isReachable()) {
    log(`database reachable on ${HOST}:${PORT} as '${DB_USER}'`);
    return true;
  }
  log(`something is listening on ${HOST}:${PORT} but '${DB_USER}' could not sign in with the server/.env credentials`);
  return false;
};

const stop = async () => {
  if (!(await isPortOpen(HOST, PORT))) {
    log('nothing to stop');
    return;
  }
  const mysqladmin = findFile(SERVER_DIR, 'mysqladmin.exe');
  if (mysqladmin) {
    run(mysqladmin, [
      `--host=${HOST}`,
      `--port=${PORT}`,
      `--user=${DB_USER}`,
      `--password=${DB_PASSWORD}`,
      'shutdown',
    ]);
  }
  for (let i = 0; i < 12; i += 1) {
    if (!(await isPortOpen(HOST, PORT))) {
      log('database stopped');
      return;
    }
    await sleep(500);
  }

  // Graceful shutdown failed → stop the instances that belong to this project
  if (killOwnMysqld() > 0) {
    await sleep(1500);
  }
  log((await isPortOpen(HOST, PORT)) ? 'database is still responding' : 'database stopped');
};

const start = async () => {
  if (await isReachable()) {
    log('database already running');
    return;
  }

  if (await isPortOpen(HOST, PORT)) {
    // Self-heal: a leftover/half-initialised instance of our own database is
    // cleared away, anything else on the port is left untouched.
    if (killOwnMysqld() > 0) {
      await sleep(1500);
    }
  }

  if (await isPortOpen(HOST, PORT)) {
    log(`port ${PORT} is used by another server, but '${DB_USER}' could not sign in with the credentials in server/.env.`);
    log('Update DB_USER / DB_PASSWORD (or stop that server) and retry.');
    return;
  }

  await download();
  extract();
  startMysqld();

  if (!(await waitForPort(PORT))) {
    const tail = fileExists(LOG_FILE)
      ? fs.readFileSync(LOG_FILE, 'utf8').split('\n').filter(Boolean).slice(-10).join('\n')
      : '';
    fail(`mysqld did not start within 90s. Last log lines:\n${tail}`);
  }
  await ensureDatabaseAndUser();
};

const remove = async () => {
  await stop();
  fs.rmSync(DB_DIR, { recursive: true, force: true });
  log('removed the .localdb folder (portable database + data)');
};

const main = async () => {
  const command = (process.argv[2] || 'ensure').toLowerCase();

  if (!IS_LOCAL) {
    log(`DB_HOST is '${HOST}' — that is a remote database, so the portable local server is not used.`);
    if (command === 'status') process.exitCode = (await isReachable()) ? 0 : 1;
    return;
  }

  try {
    switch (command) {
      case 'start':
        await start();
        break;
      case 'ensure':
        try {
          if (await isReachable()) log('database already running');
          else await start();
        } catch (error) {
          console.error(`[localDb] ${error.message}`);
          console.error('[localDb] Starting the API anyway — database endpoints will report the connection error.');
          console.error('[localDb] Once fixed, run: npm run db:start');
        }
        break;
      case 'stop':
        await stop();
        break;
      case 'status':
        process.exitCode = (await status()) ? 0 : 1;
        break;
      case 'remove':
        await remove();
        break;
      default:
        fail(`unknown command '${command}' (use ensure | start | stop | status | remove)`);
    }
  } catch (error) {
    console.error(`[localDb] ${error.message}`);
    process.exitCode = 1;
  }
};

main();
