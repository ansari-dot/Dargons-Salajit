const { calculateCost, getCalculatorOptions } = require('../services/calculator.service')

const calculateCostController = async(req,res)=>{
    try{
        const data = req.body

        const result = await calculateCost(data)

        return res.status(200).json({
            message:'Cost calculated successfully',
            success:true,
            data:result
        })
    }catch(error){
        return res.status(400).json({
            message:error.message,
            success:false
        })
    }
}

const getCalculatorOptionsController = async(req,res)=>{
    try{
        const result = await getCalculatorOptions()

        return res.status(200).json({
            message:'Calculator options fetched successfully',
            success:true,
            data:result
        })
    }catch(error){
        return res.status(400).json({
            message:error.message,
            success:false
        })
    }
}

module.exports = {
    calculateCostController,
    getCalculatorOptionsController
};