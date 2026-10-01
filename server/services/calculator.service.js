const CalculatorModel = require("../models/CalculatorModel");

const calculateCost = async (data) => {
    // Destructure data
    const {
        productId,
        packageType,
        fillSize,
        strength,

        finishedQuantity,

        packagingId,
        packagingPurchaseQuantity,

        printingCost = 0,
        setupCost = 0,
        otherCosts = 0,
        shipping = 0,
        discount = 0

    } = data;

    if (!productId) {
        throw new Error("Product is required");
    }

    if (!packageType) {
        throw new Error("Package type is required");
    }

    if (!fillSize) {
        throw new Error("Fill size is required");
    }

    if (!finishedQuantity || finishedQuantity <= 0) {
        throw new Error(
            "Finished quantity must be greater than 0"
        );
    }

    if (!packagingId) {
        throw new Error("Packaging is required");
    }

    if (
        !packagingPurchaseQuantity ||
        packagingPurchaseQuantity <= 0
    ) {
        throw new Error(
            "Packaging purchase quantity must be greater than 0"
        );
    }

    // Fetch product pricing
    const product =
        await CalculatorModel.getProductOption({
            productId,
            packageType,
            fillSize,
            strength
        });


    if (!product) {
        throw new Error(
            "Product pricing not found"
        );
    }
    // Fetch packaging details
    const packaging =
        await CalculatorModel.getPackaging(
            packagingId
        );


    if (!packaging) {
        throw new Error(
            "Packaging not found"
        );
    }
    // Calculate costs
    const productUnitPrice =
        Number(product.price_per_unit);

    const productCost =
        productUnitPrice *
        Number(finishedQuantity);

    const packagingUnitPrice =
        Number(packaging.price_per_unit);

    const packagingCost =
        packagingUnitPrice *
        Number(packagingPurchaseQuantity);

    const printing =
        Number(printingCost) || 0;

    const setup =
        Number(setupCost) || 0;

    const other =
        Number(otherCosts) || 0;

    const shippingCost =
        Number(shipping) || 0;

    const discountAmount =
        Number(discount) || 0;

    const estimatedProjectCost =
        productCost +
        packagingCost +
        printing +
        setup +
        other +
        shippingCost -
        discountAmount;

    return {

        product: {
            id: product.product_id,
            name: product.product_name,
            packageType: product.package_type,
            fillSize: product.fill_size,
            strength: product.strength,

            unitPrice: productUnitPrice,

            quantity:
                Number(finishedQuantity),

            total: productCost
        },


        packaging: {
            id: packaging.id,
            name: packaging.name,
            type: packaging.packaging_type,

            unitPrice: packagingUnitPrice,

            quantity:
                Number(packagingPurchaseQuantity),

            total: packagingCost
        },


        additionalCosts: {

            printing,
            setup,
            other,
            shipping: shippingCost,
            discount: discountAmount
        },


        summary: {

            filledProductCost:
                productCost,

            packagingInventoryCost:
                packagingCost,

            printingCost:
                printing,

            setupCost:
                setup,

            otherCosts:
                other,

            shipping:
                shippingCost,

            discounts:
                discountAmount,

            estimatedProjectCost:
                estimatedProjectCost
        }
    };

}


const getCalculatorOptions = async () => {
    return await CalculatorModel.getOptions();
};


module.exports = {
    calculateCost,
    getCalculatorOptions
};