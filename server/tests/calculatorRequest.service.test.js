const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');
const CalculatorRequestModel = require('../models/CalculatorRequestModel');
const PricingEngine = require('../services/pricingEngine');
const { createCalculatorRequest } = require('../services/calculatorRequest.service');

const originalCreateRequest = CalculatorRequestModel.createRequest;
const originalCalculate = PricingEngine.calculate;

afterEach(() => {
  CalculatorRequestModel.createRequest = originalCreateRequest;
  PricingEngine.calculate = originalCalculate;
});

test('quotation requests persist backend totals and packaging breakdown', async () => {
  const packageItem = {
    packagingId: 7,
    name: 'Spoon',
    type: 'spoon',
    purchasedQuantity: 200,
  };
  let persistedData;
  PricingEngine.calculate = async () => ({
    pricingAvailable: true,
    product: { name: 'Shilajit Resin' },
    packagingBreakdown: [packageItem],
    summary: {
      filledProductCost: 1000,
      packagingInventoryCost: 200,
      printingCost: 30,
      setupCost: 40,
      otherCosts: 50,
      shipping: 60,
      discounts: 70,
      estimatedProjectCost: 1310,
    },
  });
  CalculatorRequestModel.createRequest = async (data) => {
    persistedData = data;
    return { id: 12, referenceNo: 'PL-2026-123456' };
  };

  const result = await createCalculatorRequest({
    productId: 1,
    productCost: 999999,
    packagingCost: 999999,
    estimatedProjectCost: 999999,
    configurationSnapshot: { notes: 'quote' },
  });

  assert.equal(persistedData.productCost, 1000);
  assert.equal(persistedData.packagingCost, 200);
  assert.equal(persistedData.estimatedProjectCost, 1310);
  assert.equal(persistedData.packagingId, packageItem.packagingId);
  assert.deepEqual(persistedData.configurationSnapshot.packagingBreakdown, [packageItem]);
  assert.equal(persistedData.configurationSnapshot.notes, 'quote');
  assert.equal(result.referenceNo, 'PL-2026-123456');
});

test('unpriced quotation does not persist client-provided totals', async () => {
  let persistedData;
  PricingEngine.calculate = async () => ({
    pricingAvailable: false,
    message: 'Pricing is unavailable.',
    packagingBreakdown: [],
    summary: null,
  });
  CalculatorRequestModel.createRequest = async (data) => {
    persistedData = data;
    return { id: 13, referenceNo: 'PL-2026-654321' };
  };

  await createCalculatorRequest({
    productId: 1,
    productCost: 50000,
    packagingCost: 20000,
    estimatedProjectCost: 70000,
    additionalCosts: { printingCost: '25', discounts: '5' },
  });

  assert.equal(persistedData.productCost, 0);
  assert.equal(persistedData.packagingCost, 0);
  assert.equal(persistedData.estimatedProjectCost, 0);
  assert.equal(persistedData.printingCost, 25);
  assert.equal(persistedData.discount, 5);
  assert.equal(persistedData.configurationSnapshot.calculation.pricingAvailable, false);
});
