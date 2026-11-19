// Run from server/ folder:  node scripts/createAdmin.cjs
require('dotenv').config();

const { ensureLocalDatabase } = require('../config/ensureLocalDb');

(async () => {
  try {
    await ensureLocalDatabase();

    const { createAdmin } = require('../services/admin.service');
    const user = await createAdmin({
      email: 'yawarhussain793@gmail.com',
      password: 'yawar123',
      firstName: 'Yawar',
      lastName: 'Hussain',
      phone: '03445789763',
      firstNameFallback: 'Admin',
      lastNameFallback: 'Owner',
    });

    console.log('✅ Admin account ready:');
    console.log('   Email   :', user.email);
    console.log('   Role    :', user.role);
    console.log('   Name    :', user.first_name || user.firstName, user.last_name || user.lastName);
    console.log('   ID      :', user.id);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
})();
