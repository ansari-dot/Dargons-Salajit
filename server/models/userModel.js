const db = require('../config/db');
const bcrypt = require('bcryptjs');

class UserModel {
  // Find all users with order stats
  static async findAll() {
    const [rows] = await db.query(
      `SELECT 
        u.id, 
        COALESCE(u.first_name, u.firstName, u.name, '') AS first_name, 
        COALESCE(u.last_name, u.lastName, '') AS last_name, 
        u.email, 
        COALESCE(u.phone, '') AS phone, 
        COALESCE(u.street_address, u.streetAddress, '') AS street_address, 
        COALESCE(u.city, '') AS city, 
        COALESCE(u.postal_code, u.postcode, '') AS postal_code, 
        COALESCE(u.role, 'customer') AS role, 
        COALESCE(u.createdAt, NOW()) AS created_at,
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
        COALESCE(first_name, firstName, name, '') AS first_name, 
        COALESCE(last_name, lastName, '') AS last_name, 
        email, phone, street_address, city, postal_code, role, COALESCE(createdAt, NOW()) AS created_at 
       FROM users WHERE id = ?`,
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
      role = 'customer'
    } = userData;

    const fName = first_name || firstName || '';
    const lName = last_name || lastName || '';

    // Hash password using bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      `INSERT INTO users (first_name, firstName, last_name, lastName, email, phone, street_address, streetAddress, city, postal_code, postcode, password, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [fName, fName, lName, lName, email, phone, street_address, street_address, city, postal_code, postal_code, hashedPassword, role]
    );

    return { id: result.insertId, first_name: fName, last_name: lName, email, phone, city, role };
  }

  // Compare entered password with stored hashed password
  static async comparePassword(enteredPassword, hashedPassword) {
    return await bcrypt.compare(enteredPassword, hashedPassword);
  }

  // Update user profile
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
