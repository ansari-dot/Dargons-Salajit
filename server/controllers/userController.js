const UserService = require('../services/userService');
const { sendSuccess } = require('../utils/responseHandler');

const getUsers = async (req, res, next) => {
  try {
    const users = await UserService.getAllUsers();
    return sendSuccess(res, users, 'Users fetched successfully');
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await UserService.getUserById(req.params.id);
    return sendSuccess(res, user, 'User fetched successfully');
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const user = await UserService.createUser(req.body);
    return sendSuccess(res, user, 'User created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const updatedUser = await UserService.updateUser(req.params.id, req.body);
    return sendSuccess(res, updatedUser, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await UserService.deleteUser(req.params.id);
    return sendSuccess(res, null, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
