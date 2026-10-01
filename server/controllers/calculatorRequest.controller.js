const {

    createCalculatorRequest,
    getAllCalculatorRequests,
    getCalculatorRequestById,
    updateCalculatorRequestStatus,
    getUserCalculatorRequests

} = require("../services/calculatorRequest.service");


const createCalculatorRequestController = async (req, res) => {
    try {
        const data = req.body;
        const result = await createCalculatorRequest(data);

        return res.status(201).json({
            message: "Calculator request created successfully",
            success: true,
            data: result
        });
    } catch (error) {
        return res.status(400).json({
            message: error.message,
            success: false
        });
    }
};


const getAllCalculatorRequestsController = async (req, res) => {
    try{
        const result = await getAllCalculatorRequests();

        return res.status(200).json({
            message: "Calculator requests fetched successfully",
            success: true,
            data: result
        });
    }catch(error){
        return res.status(400).json({
            message: error.message,
            success: false
        });
    }
}

const getCalculatorRequestByIdController = async (req, res) => {
    try{
        const requestId = req.params.id;
        const result = await getCalculatorRequestById(requestId);

        if(!result){
            return res.status(404).json({
                message: "Calculator request not found",
                success: false
            });
        }

        return res.status(200).json({
            message: "Calculator request fetched successfully",
            success: true,
            data: result
        });
    }catch(error){
        return res.status(400).json({
            message: error.message,
            success: false
        });
    }
}

const updateCalculatorRequestStatusController = async (req, res) => {
    try{
        const  { status, adminNote } = req.body;
        const requestId = req.params.id;

        const result = await updateCalculatorRequestStatus(requestId, status, adminNote);

        return res.status(200).json({
            message: "Calculator request status updated successfully",
            success: true,
            data: result
        });
    }catch(error){
        return res.status(400).json({
            message: error.message,
            success: false
        });
    }
}


const getUserRequestsController = async (req, res) => {
    try{
        const userId = req.params.userId;
        const result = await getUserCalculatorRequests(userId);

        return res.status(200).json({
            message: "User calculator requests fetched successfully",
            success: true,
            data: result
        });
    }
    catch(error){
        return res.status(400).json({
            message: error.message,
            success: false
        });
    }
    }


module.exports = {
    createCalculatorRequestController,
    getAllCalculatorRequestsController,
    getCalculatorRequestByIdController,
    updateCalculatorRequestStatusController,
    getUserRequestsController
}