const UserModel = require('../models/userModel');
const AppError = require('../utils/AppErros');


const getAllCustomer = async ({ role } = {}) => {
  const customers = await UserModel.findAll();

  if (role && typeof role === 'string' && role.trim()) {
    const wanted = role.trim().toLowerCase();
    return customers.filter(
      (customer) => String(customer.role || 'customer').toLowerCase() === wanted
    );
  }

  return customers;
};

const getCustomerById = async ({ userId } = {}) => {
  if (!userId) {
    throw new AppError('User ID is required.', 400);
  }

  const customer = await UserModel.findByIdWithStats(userId);
  if (!customer) {
    throw new AppError('User not found', 404);
  }

  return customer;
};

const DeleteUser = async ({ userId } = {}) => {
  if (!userId) {
    throw new AppError('User ID is required.', 400);
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  await UserModel.delete(userId);
  return user;
};

const getTotalUsers = async()=>{
  return await UserModel.countAll()
}

module.exports = {
  getAllCustomer,
  getCustomerById,
  DeleteUser,
  getTotalUsers
};