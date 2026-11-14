const CalculatorRequestModel  = require('../models/CalculatorRequestModel');
const { calculateCost } = require('./calculator.service');

const normalizeCost = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? Math.max(0, amount) : 0;
};

const createCalculatorRequest = async (data) => {
    const calculation = await calculateCost(data);
    const summary = calculation.summary || {};
    const additionalCosts = data.additionalCosts || {};
    const packagingBreakdown = calculation.packagingBreakdown || [];
    const firstPackagingItem = packagingBreakdown[0];
    const snapshot = typeof data.configurationSnapshot === 'string'
        ? JSON.parse(data.configurationSnapshot)
        : (data.configurationSnapshot || {});

    const authoritativeData = {
        ...data,
        productName: calculation.product?.name || data.productName || null,
        packageType: firstPackagingItem?.type || null,
        packagingId: firstPackagingItem?.packagingId || null,
        packagingName: firstPackagingItem?.name || null,
        packagingPurchaseQuantity: firstPackagingItem?.purchasedQuantity || null,
        productCost: summary.filledProductCost ?? 0,
        packagingCost: summary.packagingInventoryCost ?? 0,
        printingCost: summary.printingCost ?? normalizeCost(additionalCosts.printingCost),
        setupCost: summary.setupCost ?? normalizeCost(additionalCosts.setupCost),
        otherCosts: summary.otherCosts ?? normalizeCost(additionalCosts.otherCosts),
        shipping: summary.shipping ?? normalizeCost(additionalCosts.shipping),
        discount: summary.discounts ?? normalizeCost(additionalCosts.discounts ?? additionalCosts.discount),
        estimatedProjectCost: summary.estimatedProjectCost ?? 0,
        configurationSnapshot: {
            ...snapshot,
            calculation,
            packagingBreakdown,
            packagingPurchases: data.packagingPurchases || {},
        },
    };

    const request = await CalculatorRequestModel.createRequest(authoritativeData);

    return {
        requestId: request.id,
        referenceNo: request.referenceNo,
        status: 'pending'
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