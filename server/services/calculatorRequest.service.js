const CalculatorRequestModel  = require('../models/CalculatorRequestModel');

const createCalculatorRequest = async (data) => {
    const requestId = await CalculatorRequestModel.createRequest(data)

    return {
        requestId,
        status:'pending'
    }
}

const getAllCalculatorRequests = async()=>{
    // Rows already arrive newest-first from the model (ORDER BY created_at
    // DESC) — do NOT call Array#sort with a mongo-style comparator here, it
    // throws a TypeError and breaks the admin endpoint.
    return await CalculatorRequestModel.findAllWithUser();
}

const getCalculatorRequestById = async(requestId)=>{
    const request = await CalculatorRequestModel.findById(requestId)
    return request
}

const updateCalculatorRequestStatus  = async(Id,status,adminNote)=>{
    if(!["pending", "approved", "rejected"].includes(String(status || "").toLowerCase())){
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