const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const SERVER_DIR = path.resolve(__dirname, '..');
const LOCAL_DB_SCRIPT = path.join(SERVER_DIR, 'scripts', 'localDb.cjs');

/**
 * Makes sure a database is answering on DB_HOST:DB_PORT before the API boots.
 *
 * When server/.env points at this machine (localhost / 127.0.0.1) and nothing is
 * listening on the configured port, the portable MariaDB inside `server/.localdb`
 * is downloaded (first run), initialised and started by scripts/localDb.cjs — no
 * Windows service and no admin rights required.
 *
 * When a real MySQL/MariaDB is already serving that port (or DB_HOST is a remote
 * host) this is a no-op. It never throws: the API always starts, and database
 * errors are reported per request by the error handler.
 */
const ensureLocalDatabase = () => {
  if (!fs.existsSync(LOCAL_DB_SCRIPT)) return Promise.resolve(false);

  try {
    const result = spawnSync(process.execPath, [LOCAL_DB_SCRIPT, 'ensure'], {
      stdio: 'inherit',
      windowsHide: true,
    });
    return Promise.resolve(result.status === 0);
  } catch (error) {
    console.warn(`[db] Could not check the local database: ${error.message}`);
    return Promise.resolve(false);
  }
};

module.exports = { ensureLocalDatabase };