const CalculatorRequestModel  = require('../models/calculatorRequestModel');

const createCalculatorRequest = async (data) => {
    const requestId = await CalculatorRequestModel.createRequest(data)

    return {
        requestId,
        status:'pending'
    }
}

const getAllCalculatorRequests = async()=>{
    return await CalculatorRequestModel.findAll().sort({ createdAt: -1 })
}

const getCalculatorRequestById = async(requestId)=>{
    const request = await CalculatorRequestModel.findById(requestId)
    return request
}

const updateCalculatorRequestStatus  = async(Id,status,adminNote)=>{
    if(!status === 'pending' && !status === 'approved' && !status === 'rejected'){
        throw new Error('Invalid status value. Must be "pending", "approved", or "rejected".');
    }

    const request = await CalculatorRequestModel.findById(Id)
    if(!request){
        throw new Error('Calculator request not found.');
    }

    await CalculatorRequestModel.UpdateStatus(Id,status,adminNote)

    return {
        Id,
        status,
        adminNote
    }
}

const getUserCalculatorRequests = async (
    userId
) => {

    return await CalculatorRequestModel
        .findByUserId(userId);
};


module.exports = {

    createCalculatorRequest,

    getAllCalculatorRequests,

    getCalculatorRequestById,

    updateCalculatorRequestStatus,

    getUserCalculatorRequests
};