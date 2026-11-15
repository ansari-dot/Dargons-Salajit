const assert = require('node:assert/strict');
const { afterEach, beforeEach, test } = require('node:test');
const db = require('../config/db');
const PricingEngine = require('../services/pricingEngine');

const originalQuery = db.query;

const productTiers = [{
  id: 1,
  min_quantity: 1000,
  max_quantity: null,
  rate: 2,
  is_open_ended: 1,
  pricing_version: 1
}];

let packagingTiers = [
  { id: 2, min_quantity: 100, max_quantity: 499, rate: 60, is_open_ended: 0 },
  { id: 3, min_quantity: 500, max_quantity: 999, rate: 50, is_open_ended: 0 },
  { id: 4, min_quantity: 1000, max_quantity: 5000, rate: 40, is_open_ended: 0 }
];

let packagingName = 'Carton box';
let packagingType = 'box';

const mockDatabase = () => {
  db.query = async (sql, params = []) => {
    if (sql.includes('FROM calculator_products WHERE id =')) {
      const productId = Number(params[0]);
      return [[{
        id: productId,
        name: productId === 2 ? 'Liquid Shilajit 30ml' : 'Gold Grade Shilajit Resin',
        slug: productId === 2 ? 'liquid-shilajit-30ml' : 'gold-grade-shilajit-resin'
      }]];
    }

    if (sql.includes('FROM calculator_pricing_tiers')) {
      return [params[0] === 'product' ? productTiers : packagingTiers];
    }

    if (sql.includes('FROM calculator_product_packaging_rules')) {
      return [[{
        component_type: 'required',
        alternative_group: null,
        is_default: 1,
        pkg_id: 20,
        pkg_name: packagingName,
        pkg_code: 'BOX-20',
        pkg_type: packagingType,
        moq: 100,
        unit_price: null,
        estimated_weight: '2-3 g',
        dieline_url: null,
        capacity: null
      }]];
    }

    throw new Error(`Unexpected database query in test: ${sql}`);
  };
};

const calculate = (finishedQuantity, purchasedQuantity, productId = 1) => PricingEngine.calculate({
  productId,
  fillSize: productId === 1 ? 10 : undefined,
  finishedQuantity,
  packagingPurchases: purchasedQuantity === undefined ? {} : { 20: purchasedQuantity }
});

beforeEach(() => {
  packagingName = 'Carton box';
  packagingType = 'box';
  packagingTiers = [
    { id: 2, min_quantity: 100, max_quantity: 499, rate: 60, is_open_ended: 0 },
    { id: 3, min_quantity: 500, max_quantity: 999, rate: 50, is_open_ended: 0 },
    { id: 4, min_quantity: 1000, max_quantity: 5000, rate: 40, is_open_ended: 0 }
  ];
  mockDatabase();
});
afterEach(() => {
  db.query = originalQuery;
});

test('required 300 and purchased 300 yields no remaining packaging', async () => {
  const result = await calculate(300, 300);
  const item = result.packagingBreakdown[0];

  assert.equal(result.pricingAvailable, true);
  assert.equal(item.requiredQuantity, 300);
  assert.equal(item.purchasedQuantity, 300);
  assert.equal(item.remainingQuantity, 0);
  assert.equal(item.totalCost, 300 * 60);
  assert.deepEqual(item.nextCheaperTier, { minQuantity: 500, rate: 50 });
});

test('surplus purchase shows a cheaper next tier without changing the selected tier', async () => {
  const result = await calculate(300, 400);
  const item = result.packagingBreakdown[0];

  assert.equal(result.pricingAvailable, true);
  assert.equal(item.unitPrice, 60);
  assert.equal(item.remainingQuantity, 100);
  assert.deepEqual(item.nextCheaperTier, { minQuantity: 500, rate: 50 });
});

test('purchased quantity selects tier price and charges all surplus units', async () => {
  const result = await calculate(300, 1001);
  const item = result.packagingBreakdown[0];

  assert.equal(result.pricingAvailable, true);
  assert.equal(item.unitPrice, 40);
  assert.equal(item.remainingQuantity, 701);
  assert.equal(item.totalCost, 1001 * 40);
  assert.equal(item.usedCost, 300 * 40);
  assert.equal(item.remainingCost, 701 * 40);
  assert.equal(result.summary.totalPackagingWeightMinG, 2002);
  assert.equal(result.summary.totalPackagingWeightMaxG, 3003);
  assert.equal(result.summary.remainingPackagingWeightMinG, 1402);
  assert.equal(result.summary.remainingPackagingWeightMaxG, 2103);
  assert.equal(item.nextCheaperTier, null);
});

test('required below MOQ defaults purchased quantity to MOQ without an error', async () => {
  const result = await calculate(60, undefined, 2);
  const item = result.packagingBreakdown[0];

  assert.equal(result.pricingAvailable, true);
  assert.equal(item.requiredQuantity, 60);
  assert.equal(item.purchasedQuantity, 100);
  assert.equal(item.remainingQuantity, 40);
  assert.equal(item.minimumOrderNotice, true);
});

test('manual purchase below MOQ returns quotation-only pricing and breakdown', async () => {
  const result = await calculate(300, 99);
  const item = result.packagingBreakdown[0];

  assert.equal(result.pricingAvailable, false);
  assert.match(result.message, /MOQ:|minimum order|Minimum order/i);
  assert.equal(item.purchasedQuantity, 99);
  assert.equal(item.remainingQuantity, 0);
  assert.equal(item.unitPrice, null);
  assert.equal(item.totalCost, null);
});

test('purchase above the highest configured slab redirects to quotation', async () => {
  const result = await calculate(300, 6000);
  const item = result.packagingBreakdown[0];

  assert.equal(result.pricingAvailable, false);
  assert.match(result.message, /quotation/i);
  assert.equal(item.purchasedQuantity, 6000);
  assert.equal(item.unitPrice, null);
});

test('invalid manual packaging quantities are rejected instead of rounded or defaulted', async () => {
  for (const quantity of ['', 'text', 0, -1, 1.5, '1.5', Number.MAX_SAFE_INTEGER + 1]) {
    await assert.rejects(
      calculate(300, quantity),
      /purchased quantity must be a positive whole number/i
    );
  }
});

test('bleached card box boundaries use their configured tier without interpolation', async () => {
  packagingName = 'Bleached Card Box';
  packagingTiers = [
    { id: 10, min_quantity: 200, max_quantity: 200, rate: 90, is_open_ended: 0 },
    { id: 11, min_quantity: 201, max_quantity: 500, rate: 70, is_open_ended: 0 },
    { id: 12, min_quantity: 501, max_quantity: 1000, rate: 50, is_open_ended: 0 },
    { id: 13, min_quantity: 1001, max_quantity: 5000, rate: 40, is_open_ended: 0 }
  ];

  for (const [quantity, rate] of [
    [200, 90], [201, 70], [500, 70], [501, 50], [1000, 50], [1001, 40], [5000, 40]
  ]) {
    const result = await calculate(300, quantity);
    assert.equal(result.pricingAvailable, true, `${quantity} pcs should be priced`);
    assert.equal(result.packagingBreakdown[0].unitPrice, rate, `${quantity} pcs should use Rs. ${rate}`);
  }

  const unavailable = await calculate(300, 5001);
  assert.equal(unavailable.pricingAvailable, false);
  assert.equal(unavailable.packagingBreakdown[0].unitPrice, null);
});

test('jar, label, and insert weights are excluded from packaging weight estimates', async () => {
  for (const name of ['Glass Jar', 'Bottle Label', 'Insert Card']) {
    packagingName = name;
    const result = await calculate(300, 300);
    const item = result.packagingBreakdown[0];

    assert.equal(item.weightExcludedFromEstimate, true);
    assert.equal(result.summary.totalPackagingWeightMinG, null);
    assert.equal(result.summary.totalPackagingWeightMaxG, null);
  }
});
