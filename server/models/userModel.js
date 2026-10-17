const db = require('../config/db');
const bcrypt = require('bcryptjs');

class UserModel {
  // Find all users with order stats
  static async findAll() {
    const [rows] = await db.query(
      `SELECT 
        u.id, 
        COALESCE(u.first_name, u.firstName, '') AS first_name, 
        COALESCE(u.last_name, u.lastName, '') AS last_name, 
        u.email, 
        COALESCE(u.phone, '') AS phone, 
        COALESCE(u.street_address, u.streetAddress, '') AS street_address, 
        COALESCE(u.city, '') AS city, 
        COALESCE(u.postal_code, u.postcode, '') AS postal_code, 
        COALESCE(u.role, 'customer') AS role, 
        COALESCE(u.created_at, NOW()) AS created_at,
        COUNT(o.id) AS orders_count,
        COALESCE(SUM(o.grand_total), 0) AS total_spent
       FROM users u
       LEFT JOIN orders o ON (o.user_id = u.id OR (u.email IS NOT NULL AND u.email != '' AND o.email = u.email))
       GROUP BY u.id
       ORDER BY u.id DESC`
    );
    return rows;
  }

  // Find user by ID
  static async findById(id) {
    const [rows] = await db.query(
      `SELECT id, 
        COALESCE(first_name, firstName, '') AS first_name, 
        COALESCE(last_name, lastName, '') AS last_name, 
        email, phone, street_address, city, postal_code, role, COALESCE(created_at, NOW()) AS created_at 
       FROM users WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  // Find user by ID including order stats (used by admin "show customer")
  static async findByIdWithStats(id) {
    const [rows] = await db.query(
      `SELECT 
        u.id, 
        COALESCE(u.first_name, u.firstName, '') AS first_name, 
        COALESCE(u.last_name, u.lastName, '') AS last_name, 
        u.email, 
        COALESCE(u.phone, '') AS phone, 
        COALESCE(u.street_address, u.streetAddress, '') AS street_address, 
        COALESCE(u.city, '') AS city, 
        COALESCE(u.postal_code, u.postcode, '') AS postal_code, 
        COALESCE(u.role, 'customer') AS role, 
        COALESCE(u.created_at, NOW()) AS created_at,
        COALESCE(u.email_verified, 1) AS email_verified,
        COUNT(o.id) AS orders_count,
        COALESCE(SUM(o.grand_total), 0) AS total_spent
       FROM users u
       LEFT JOIN orders o ON (o.user_id = u.id OR (u.email IS NOT NULL AND u.email != '' AND o.email = u.email))
       WHERE u.id = ?
       GROUP BY u.id`,
      [id]
    );
    return rows[0] || null;
  }

  // Find user by Email (includes password for login validation)
  static async findByEmail(email) {
    const [rows] = await db.query(
      `SELECT * FROM users WHERE email = ?`,
      [email]
    );
    return rows[0] || null;
  }

  // Find user by Refresh Token
  static async findByRefreshToken(token) {
    const [rows] = await db.query(
      `SELECT * FROM users WHERE refresh_token = ?`,
      [token]
    );
    return rows[0] || null;
  }

  // Save / Update Refresh Token in DB
  static async updateRefreshToken(id, refreshToken) {
    await db.query(`UPDATE users SET refresh_token = ? WHERE id = ?`, [refreshToken, id]);
  }

  // Clear Refresh Token from DB
  static async clearRefreshToken(id) {
    await db.query(`UPDATE users SET refresh_token = NULL WHERE id = ?`, [id]);
  }

  // Count all users
  static async countAll() {
    const [rows] = await db.query(`SELECT COUNT(*) AS count FROM users`);
    return Number(rows[0]?.count || 0);
  }

  // Save a 6-digit email verification code (with expiry) for a user
  static async setVerificationCode(id, code, expiresAt) {
    await db.query(
      `UPDATE users SET verification_code = ?, verification_expires_at = ?, verification_sent_at = NOW() WHERE id = ?`,
      [code, expiresAt, id]
    );
  }

  // Mark a user's email as verified and clear the verification code
  static async markEmailVerified(id) {
    await db.query(
      `UPDATE users SET email_verified = 1, verification_code = NULL, verification_expires_at = NULL WHERE id = ?`,
      [id]
    );
  }

  // Save a hashed password-reset token (with expiry) for a user
  static async setResetToken(id, tokenHash, expiresAt) {
    await db.query(
      `UPDATE users SET reset_token = ?, reset_expires_at = ?, reset_sent_at = NOW() WHERE id = ?`,
      [tokenHash, expiresAt, id]
    );
  }

  // Find user by password-reset token hash
  static async findByResetToken(tokenHash) {
    const [rows] = await db.query(
      `SELECT * FROM users WHERE reset_token = ?`,
      [tokenHash]
    );
    return rows[0] || null;
  }

  // Set a new password and invalidate the reset token + any active sessions
  static async resetPassword(id, hashedPassword) {
    await db.query(
      `UPDATE users SET password = ?, reset_token = NULL, reset_expires_at = NULL, refresh_token = NULL WHERE id = ?`,
      [hashedPassword, id]
    );
  }

  // Create new user with hashed password
  static async create(userData) {
    const {
      first_name = '',
      firstName = '',
      last_name = '',
      lastName = '',
      email,
      phone = '',
      street_address = '',
      city = '',
      postal_code = '',
      password = 'Password123!',
      role = 'customer',
      email_verified = 1
    } = userData;

    const fName = first_name || firstName || '';
    const lName = last_name || lastName || '';

    // Hash password using bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      `INSERT INTO users (first_name, firstName, last_name, lastName, email, phone, street_address, streetAddress, city, postal_code, postcode, password, role, email_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [fName, fName, lName, lName, email, phone, street_address, street_address, city, postal_code, postal_code, hashedPassword, role, email_verified]
    );

    return { id: result.insertId, first_name: fName, last_name: lName, email, phone, city, role };
  }

  // Compare entered password with stored hashed password
  static async comparePassword(enteredPassword, hashedPassword) {
    return await bcrypt.compare(enteredPassword, hashedPassword);
  }

  static async update(id, userData) {
    const fields = [];
    const values = [];

    const allowedFields = ['first_name', 'last_name', 'email', 'phone', 'street_address', 'city', 'postal_code', 'role'];

    for (const key of allowedFields) {
      if (userData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(userData[key]);
      }
    }

    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      fields.push(`password = ?`);
      values.push(await bcrypt.hash(userData.password, salt));
    }

    if (fields.length === 0) return null;

    values.push(id);
    const [result] = await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result;
  }

  // Delete user by ID
  static async delete(id) {
    const [result] = await db.query(`DELETE FROM users WHERE id = ?`, [id]);
    return result;
  }
}

module.exports = UserModel;
