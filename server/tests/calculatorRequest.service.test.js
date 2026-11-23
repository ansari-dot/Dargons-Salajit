const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');
const db = require('../config/db');
const CalculatorRequestModel = require('../models/CalculatorRequestModel');
const PricingEngine = require('../services/pricingEngine');
const { createCalculatorRequest } = require('../services/calculatorRequest.service');

const originalQuery = db.query;
const originalCreateRequest = CalculatorRequestModel.createRequest;
const originalCalculate = PricingEngine.calculate;

afterEach(() => {
  db.query = originalQuery;
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

test('zero product and packaging quantities save a packaging quote without product calculation', async () => {
  let persistedData;
  db.query = async (_sql, params) => {
    assert.deepEqual(params, [1, 7]);
    return [[{
      packaging_id: 7,
      packaging_name: 'Spoon',
      packaging_type: 'spoon',
      moq: 100,
      alternative_group: 'spoons',
    }]];
  };
  PricingEngine.calculate = async () => {
    throw new Error('Product calculation should not run for a zero-quantity packaging quote.');
  };
  CalculatorRequestModel.createRequest = async (data) => {
    persistedData = data;
    return { id: 14, referenceNo: 'PL-2026-111111' };
  };

  await createCalculatorRequest({
    productId: 1,
    productName: 'Shilajit Resin',
    finishedQuantity: 0,
    selectedPackagingIds: [7],
    packagingPurchases: { 7: '0' },
    configurationSnapshot: { packagingOnly: true },
  });

  assert.equal(persistedData.productCost, 0);
  assert.equal(persistedData.packagingName, 'Spoon');
  assert.equal(persistedData.packagingPurchaseQuantity, 0);
  assert.equal(persistedData.configurationSnapshot.packagingOnly, true);
  assert.equal(persistedData.configurationSnapshot.calculation.pricingAvailable, false);
  assert.equal(persistedData.configurationSnapshot.packagingBreakdown[0].remainingQuantity, 0);
});

test('zero product quantity saves bulk quote items without product calculation', async () => {
  let persistedData;
  db.query = async () => {
    throw new Error('No packaging lookup should be needed for this bulk request.');
  };
  PricingEngine.calculate = async () => {
    throw new Error('Product calculation should not run for a zero-quantity bulk quote.');
  };
  CalculatorRequestModel.createRequest = async (data) => {
    persistedData = data;
    return { id: 15, referenceNo: 'PL-2026-222222' };
  };

  await createCalculatorRequest({
    productId: 1,
    productName: 'Shilajit Resin',
    finishedQuantity: 0,
    selectedPackagingIds: [],
    configurationSnapshot: {
      bulkOrderItems: [{ productId: 1, productName: 'Shilajit Resin', quantity: 50, unit: 'units', moq: 10 }],
    },
  });

  assert.equal(persistedData.productCost, 0);
  assert.equal(persistedData.configurationSnapshot.bulkOrderItems[0].quantity, 50);
  assert.equal(persistedData.configurationSnapshot.calculation.pricingAvailable, false);
});

test('calculator request model persists zero quantities', async () => {
  let insertedValues;
  db.query = async (_sql, values) => {
    insertedValues = values;
    return [{ insertId: 16 }];
  };

  await CalculatorRequestModel.createRequest({
    finishedQuantity: 0,
    packagingPurchaseQuantity: 0,
  });

  assert.equal(insertedValues[10], 0);
  assert.equal(insertedValues[13], 0);
});
