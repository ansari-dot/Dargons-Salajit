const CalculatorRequestModel  = require('../models/CalculatorRequestModel');
const { calculateCost } = require('./calculator.service');
const db = require('../config/db');

const normalizeCost = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? Math.max(0, amount) : 0;
};

const createCalculatorRequest = async (data) => {
    const snapshot = typeof data.configurationSnapshot === 'string'
        ? JSON.parse(data.configurationSnapshot)
        : (data.configurationSnapshot || {});
    const finishedQuantity = Number(data.finishedQuantity);
    const bulkOrderItems = Array.isArray(snapshot.bulkOrderItems)
        ? snapshot.bulkOrderItems
        : [];
    let calculation;

    if (finishedQuantity === 0) {
        const selectedPackagingIds = Array.isArray(data.selectedPackagingIds)
            ? [...new Set(data.selectedPackagingIds.map(Number))]
                .filter((id) => Number.isSafeInteger(id) && id > 0)
            : [];
        if (selectedPackagingIds.length === 0 && bulkOrderItems.length === 0) {
            throw new Error('Select at least one bulk product or packaging item before requesting a quote.');
        }

        const packagingBreakdown = [];
        if (selectedPackagingIds.length > 0) {
            const placeholders = selectedPackagingIds.map(() => '?').join(', ');
            const [packagingRows] = await db.query(
                `SELECT p.id AS packaging_id, p.name AS packaging_name, p.type AS packaging_type,
                        p.moq, r.alternative_group
                 FROM calculator_product_packaging_rules r
                 INNER JOIN calculator_packaging_items p ON p.id = r.packaging_id
                 WHERE r.product_id = ? AND r.is_active = 1 AND p.is_active = 1
                   AND p.id IN (${placeholders})`,
                [data.productId, ...selectedPackagingIds]
            );
            const packagingById = new Map(
                packagingRows.map((item) => [Number(item.packaging_id), item])
            );
            const purchases = data.packagingPurchases && typeof data.packagingPurchases === 'object'
                && !Array.isArray(data.packagingPurchases)
                ? data.packagingPurchases
                : {};

            for (const packagingId of selectedPackagingIds) {
                const item = packagingById.get(packagingId);
                if (!item) {
                    throw new Error('Selected packaging is not available for this product.');
                }

                const defaultQuantity = Math.max(1, Math.ceil(Number(item.moq) || 200));
                const rawQuantity = Object.prototype.hasOwnProperty.call(purchases, packagingId)
                    ? purchases[packagingId]
                    : defaultQuantity;
                const isIntegerString = typeof rawQuantity === 'string' && /^\d+$/.test(rawQuantity.trim());
                const isIntegerNumber = typeof rawQuantity === 'number' && Number.isSafeInteger(rawQuantity);
                const purchasedQuantity = Number(rawQuantity);
                if (
                    (!isIntegerString && !isIntegerNumber) ||
                    !Number.isSafeInteger(purchasedQuantity) ||
                    purchasedQuantity <= 0
                ) {
                    throw new Error(`${item.packaging_name} purchased quantity must be a positive whole number.`);
                }

                packagingBreakdown.push({
                    packagingId,
                    name: item.packaging_name,
                    type: item.packaging_type,
                    alternativeGroup: item.alternative_group || null,
                    moq: defaultQuantity,
                    suggestedQuantity: 0,
                    requiredQuantity: 0,
                    purchasedQuantity,
                    usedQuantity: 0,
                    remainingQuantity: purchasedQuantity,
                    unitPrice: null,
                    totalCost: null,
                });
            }
        }

        calculation = {
            pricingAvailable: false,
            message: 'A quote is required for this request because product quantity is zero.',
            product: {
                id: data.productId || null,
                name: data.productName || null,
                finishedQuantity: 0,
            },
            packagingBreakdown,
            summary: null,
        };
    } else {
        calculation = await calculateCost(data);
    }

    const summary = calculation.summary || {};
    const additionalCosts = data.additionalCosts || {};
    const packagingBreakdown = calculation.packagingBreakdown || [];
    const firstPackagingItem = packagingBreakdown[0];

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