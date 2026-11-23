const db = require('../config/db');

(async () => {
  const [cols] = await db.query(
    "SELECT COLUMN_NAME, CHARACTER_MAXIMUM_LENGTH FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME LIKE 'verification%'"
  );
  console.log('BEFORE:', JSON.stringify(cols));

  await db.query('ALTER TABLE users MODIFY COLUMN verification_code VARCHAR(64) NULL');
  console.log('ALTER_OK');

  const [after] = await db.query(
    "SELECT COLUMN_NAME, CHARACTER_MAXIMUM_LENGTH FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME LIKE 'verification%'"
  );
  console.log('AFTER:', JSON.stringify(after));
  process.exit(0);
})().catch((e) => {
  console.error('ERR:', e.message);
  process.exit(1);
});
