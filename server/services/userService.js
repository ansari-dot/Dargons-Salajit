const UserModel = require('../models/userModel');

class UserService {
  // Fetch all users
  static async getAllUsers() {
    return await UserModel.findAll();
  }

  // Get user by ID
  static async getUserById(id) {
    const user = await UserModel.findById(id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  // Register or create user from checkout
  static async createUser(userData) {
    // Check if user email already exists
    const existingUser = await UserModel.findByEmail(userData.email);
    if (existingUser) {
      const error = new Error('A user with this email address already exists');
      error.statusCode = 409; // Conflict
      throw error;
    }

    const result = await UserModel.create(userData);
    return await UserModel.findById(result.id ?? result.insertId);
  }

  // Update user
  static async updateUser(id, userData) {
    await this.getUserById(id); // Ensure user exists

    // If updating email, check duplicate
    if (userData.email) {
      const existingUser = await UserModel.findByEmail(userData.email);
      if (existingUser && existingUser.id !== parseInt(id, 10)) {
        const error = new Error('Another user with this email address already exists');
        error.statusCode = 409;
        throw error;
      }
    }

    await UserModel.update(id, userData);
    return await UserModel.findById(id);
  }

  // Delete user
  static async deleteUser(id) {
    await this.getUserById(id); // Ensure user exists
    await UserModel.delete(id);
    return true;
  }
}

module.exports = UserService;
