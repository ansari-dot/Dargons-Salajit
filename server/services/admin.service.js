const UserModel = require('../models/userModel');
const bcrypt = require('bcryptjs');

/** 
 * Creates or escalates an admin account.
 * Idempotent: if the email already exists, only the password + role are updated.
 * Used once by initDb to bootstrap the store owner account.
 */
const createAdmin = async ({ email, password, firstName = 'Admin', lastName = '', phone = '', firstNameFallback = '', lastNameFallback = '' } = {}) => {
  const trimmedEmail = String(email || '').trim();
  if (!trimmedEmail) throw new Error('Admin email is required.');

  // 1. Find or create the user
  let user = await UserModel.findByEmail(trimmedEmail);
  const isNewUser = !user;

  if (!isNewUser) {
    // 2. Ensure password matches the requested one (idempotent re-login)
    const existingHashed = user.password || '';
    const passwordMatches = await bcrypt.compare(password, existingHashed);

    if (!passwordMatches) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      await UserModel.update(user.id, { password: hashedPassword });
    }

    // 3. Idempotent role escalation
    if (String(user.role || 'customer').toLowerCase() !== 'admin') {
      await UserModel.update(user.id, { role: 'admin' });
    }

    user = await UserModel.findById(user.id);
  } else {
    // 4. New user: build the payload (mirrors the schema's columns)
    const fName = firstName || firstNameFallback || '';
    const lName = lastName || lastNameFallback || '';
    const phoneValue = phone || '';
    const streetAddress = '';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await UserModel.create({
      first_name: fName,
      firstName: fName,
      last_name: lName,
      lastName: lName,
      email: trimmedEmail,
      phone: phoneValue,
      street_address: streetAddress,
      streetAddress: streetAddress,
      city: '',
      postal_code: '',
      postcode: '',
      password: hashedPassword,
      role: 'admin',
      email_verified: 1,
    });

    user = await UserModel.findByEmail(trimmedEmail);
  }

  return user;
};

module.exports = { createAdmin };
