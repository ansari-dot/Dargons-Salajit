const {
  DeleteUser,
  getAllCustomer,
  getCustomerById,
  getTotalUsers
} = require('../services/admin.service');

// GET /api/admin/customer
const getAllUserController = async (req, res, next) => {
  try {
    const { role } = req.query;
    const userData = await getAllCustomer({ role });

    return res.status(200).json({
      message: 'Users found successfully',
      success: true,
      data: userData,
    });
  } catch (error) {
    next(error);
  }
};

const getCustomerController = async (req, res, next) => {
  try {
    const customer = await getCustomerById({ userId: req.params.id });

    return res.status(200).json({
      message: 'Customer fetched successfully',
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};


const DeleteUserController = async (req, res, next) => {
  try {
    const user = await DeleteUser({ userId: req.params.id });

    return res.status(200).json({
      message: 'User deleted successfully',
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const getTotalUserController = async(req,res,next)=>{
  try{
    const totalUsers = await getTotalUsers()
    
    return res.status(200).json({
      message:'users found successfully',
      success:true,
      data:totalUsers
    })
  }catch(error){
    next(error)
  }
}

module.exports = {
  getAllUserController,
  getCustomerController,
  DeleteUserController,
  getTotalUserController
};
