const db = require('../config/db');

async function fixConstraints() {
  try {
    await db.query(`ALTER TABLE calculator_requests DROP FOREIGN KEY calculator_requests_ibfk_2`);
    console.log('Dropped calculator_requests_ibfk_2');
  } catch (e) {
    console.log('Notice ibfk_2:', e.message);
  }

  try {
    await db.query(`ALTER TABLE calculator_requests DROP FOREIGN KEY calculator_requests_ibfk_3`);
    console.log('Dropped calculator_requests_ibfk_3');
  } catch (e) {
    console.log('Notice ibfk_3:', e.message);
  }
}

fixConstraints()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

