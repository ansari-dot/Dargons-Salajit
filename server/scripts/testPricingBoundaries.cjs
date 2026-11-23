/**
 * Automated test for Section 20 testing boundaries from developer specification
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const PricingEngine = require('../services/pricingEngine');
const db = require('../config/db');

async function runTests() {
  console.log('🧪 Starting Section 20 Boundary Tests...\n');
  let failures = 0;

  function assert(condition, message) {
    if (!condition) {
      console.error(`❌ FAILED: ${message}`);
      failures++;
    } else {
      console.log(`✅ PASSED: ${message}`);
    }
  }

  // 1. Resin Boundaries:
  // 1kg (1000g) -> Rs.75/g
  // 5kg (5000g) -> Rs.70/g
  // 10kg (10000g) -> Rs.65/g
  // 20kg (20000g) -> Rs.60/g
  // 100kg (100000g) -> Rs.58/g
  console.log('--- Testing Resin Boundaries ---');
  const resinTests = [
    { qty: 1000, expectedRate: 75, desc: '1kg' },
    { qty: 4999, expectedRate: 75, desc: '4.999kg' },
    { qty: 5000, expectedRate: 70, desc: '5kg' },
    { qty: 9999, expectedRate: 70, desc: '9.999kg' },
    { qty: 10000, expectedRate: 65, desc: '10kg' },
    { qty: 19999, expectedRate: 65, desc: '19.999kg' },
    { qty: 20000, expectedRate: 60, desc: '20kg' },
    { qty: 99999, expectedRate: 60, desc: '99.999kg' },
    { qty: 100000, expectedRate: 58, desc: '100kg' },
    { qty: 500000, expectedRate: 58, desc: '500kg' }
  ];

  for (const t of resinTests) {
    const res = await PricingEngine.findTierPrice('product', 1, t.qty);
    assert(res.available && res.rate === t.expectedRate, `Resin at ${t.desc} (${t.qty}g): got Rs.${res.rate}/g, expected Rs.${t.expectedRate}/g`);
  }

  // Above 500kg capped test
  const resinOverCap = await PricingEngine.findTierPrice('product', 1, 500001);
  assert(!resinOverCap.available, 'Resin above 500kg (capped) requires custom quotation (pricing unavailable)');

  // 2. Brochures (item id 15)
  // Boundaries: 199 (<MOQ 200), 200, 500, 501, 1000, 1001, 5000, 5001, 10000, 10001
  console.log('\n--- Testing Brochures Boundaries ---');
  const brochureBelowMoq = await PricingEngine.findTierPrice('packaging', 15, 199);
  assert(!brochureBelowMoq.available, 'Brochures at 199 (<200 MOQ): pricing unavailable / custom quote');

  const brochureTests = [
    { qty: 200, expected: 15 },
    { qty: 500, expected: 15 },
    { qty: 501, expected: 13 },
    { qty: 1000, expected: 13 },
    { qty: 1001, expected: 10 },
    { qty: 5000, expected: 10 },
    { qty: 5001, expected: 7 },
    { qty: 10000, expected: 7 }
  ];

  for (const t of brochureTests) {
    const res = await PricingEngine.findTierPrice('packaging', 15, t.qty);
    assert(res.available && res.rate === t.expected, `Brochures at ${t.qty}: got Rs.${res.rate}, expected Rs.${t.expected}`);
  }

  const brochureAboveCap = await PricingEngine.findTierPrice('packaging', 15, 10001);
  assert(!brochureAboveCap.available, 'Brochures at 10,001 (capped) requires custom quotation');

  // 3. Bleach Card Box (item id 17)
  // Boundaries: 199 (<200), 200, 499, 500, 1000, 1001, 5000, 5001, 10000, 10001
  console.log('\n--- Testing Bleach Card Box Boundaries ---');
  const bcbBelow = await PricingEngine.findTierPrice('packaging', 17, 199);
  assert(!bcbBelow.available, 'Bleach Card Box at 199 (<200 MOQ): pricing unavailable');

  const bcbTests = [
    { qty: 200, expected: 60 },
    { qty: 499, expected: 60 },
    { qty: 500, expected: 40 },
    { qty: 1000, expected: 40 },
    { qty: 1001, expected: 30 },
    { qty: 5000, expected: 30 },
    { qty: 5001, expected: 22 },
    { qty: 10000, expected: 22 }
  ];

  for (const t of bcbTests) {
    const res = await PricingEngine.findTierPrice('packaging', 17, t.qty);
    assert(res.available && res.rate === t.expected, `Bleach Card Box at ${t.qty}: got Rs.${res.rate}, expected Rs.${t.expected}`);
  }

  const bcbAbove = await PricingEngine.findTierPrice('packaging', 17, 10001);
  assert(!bcbAbove.available, 'Bleach Card Box at 10,001 (capped): requires custom quotation');

  // 4. Rigid Box (item id 18)
  // Boundaries: 100, 300, 301, 499, 500, 999, 1000, 2999, 3000, 5000
  console.log('\n--- Testing Rigid Box Boundaries ---');
  const rbBelow = await PricingEngine.findTierPrice('packaging', 18, 99);
  assert(!rbBelow.available, 'Rigid Box at 99 (<100 MOQ): pricing unavailable');

  const rbTests = [
    { qty: 100, expected: 350 },
    { qty: 300, expected: 350 },
    { qty: 301, expected: 300 },
    { qty: 499, expected: 300 },
    { qty: 500, expected: 250 },
    { qty: 999, expected: 250 },
    { qty: 1000, expected: 200 },
    { qty: 2999, expected: 200 },
    { qty: 3000, expected: 160 },
    { qty: 5000, expected: 160 }
  ];

  for (const t of rbTests) {
    const res = await PricingEngine.findTierPrice('packaging', 18, t.qty);
    assert(res.available && res.rate === t.expected, `Rigid Box at ${t.qty}: got Rs.${res.rate}, expected Rs.${t.expected}`);
  }

  const rbAbove = await PricingEngine.findTierPrice('packaging', 18, 5001);
  assert(!rbAbove.available, 'Rigid Box at 5,001 (capped): requires custom quotation');

  // 5. Open-Ended Test (Section 20):
  // "If configured as: 1,000 and above = Rs.12; test: 1000, 1001, 2000, 5000, 10000, 50000 -> All must return Rs.12/unit."
  console.log('\n--- Testing Open-Ended Rule ---');
  // Temporarily insert open-ended test tier
  const [insertRes] = await db.query(`
    INSERT INTO calculator_pricing_tiers (entity_type, entity_id, min_quantity, max_quantity, rate, is_open_ended, is_active)
    VALUES ('packaging', 9999, 1000, NULL, 12.00, 1, 1)
  `);

  const openEndedTests = [1000, 1001, 2000, 5000, 10000, 50000];
  for (const qty of openEndedTests) {
    const res = await PricingEngine.findTierPrice('packaging', 9999, qty);
    assert(res.available && res.rate === 12, `Open-ended tier at qty ${qty}: returned Rs.${res.rate}/unit (expected Rs.12)`);
  }

  // Clean up test tier
  await db.query(`DELETE FROM calculator_pricing_tiers WHERE id = ?`, [insertRes.insertId]);

  // 6. Test Full Calculation for Product 1 (Resin)
  console.log('\n--- Testing Full Resin Calculation ---');
  const resinCalc = await PricingEngine.calculate({
    productId: 1,
    fillSize: 20,
    finishedQuantity: 500, // 500 * 20g = 10,000g = 10kg -> Rs.65/g
    selectedPackagingIds: [3, 8, 11, 15, 17], // 20g Jar, Hook Spoon, Set Label, Brochure, Bleach Card Box
    packagingPurchases: {
      3: 500,  // Jar 20g (Rs.130) -> 65,000
      8: 500,  // Hook Spoon (Rs.40) -> 20,000
      11: 500, // Labels Set (500 -> Rs.22) -> 11,000
      15: 500, // Brochure (500 -> Rs.15) -> 7,500
      17: 500  // Bleach Card Box (500 -> Rs.40) -> 20,000
    },
    additionalCosts: {
      printingCost: 1500,
      setupCost: 5000,
      shipping: 2000,
      discounts: 1000
    }
  });

  assert(resinCalc.pricingAvailable, 'Resin calc succeeded');
  assert(resinCalc.product.totalCost === 10000 * 65, `Product cost: ${resinCalc.product.totalCost} (expected ${10000 * 65})`);
  const expectedPackagingCost = (500*130) + (500*40) + (500*22) + (500*15) + (500*40);
  assert(resinCalc.summary.packagingInventoryCost === expectedPackagingCost, `Packaging inventory cost: ${resinCalc.summary.packagingInventoryCost} (expected ${expectedPackagingCost})`);
  const expectedTotal = (10000 * 65) + expectedPackagingCost + 1500 + 5000 + 2000 - 1000;
  assert(resinCalc.summary.estimatedProjectCost === expectedTotal, `Master Formula total: ${resinCalc.summary.estimatedProjectCost} (expected ${expectedTotal})`);

  // Check Remaining formula: Remaining = Purchased - Used
  const jarItem = resinCalc.packagingBreakdown.find(p => p.packagingId === 3);
  assert(jarItem.remainingQuantity === jarItem.purchasedQuantity - jarItem.usedQuantity, `Remaining formula check: ${jarItem.remainingQuantity} = ${jarItem.purchasedQuantity} - ${jarItem.usedQuantity}`);

  // 7. Test Product 4 (Tablets):
  console.log('\n--- Testing Product 4 (Tablets) ---');
  const tabletCalc = await PricingEngine.calculate({
    productId: 4,
    finishedQuantity: 500, // 500 blisters
    selectedPackagingIds: [17],
    packagingPurchases: { 17: 500 }
  });
  assert(tabletCalc.product.totalCost === 500000, `Tablet 500 blisters product cost = Rs.500,000 (got ${tabletCalc.product.totalCost})`);

  console.log(`\n========================================`);
  if (failures === 0) {
    console.log('🏆 ALL TESTS PASSED SUCCESSFULLY! 100% SPEC COMPLIANCE!');
  } else {
    console.error(`❌ ${failures} test(s) failed.`);
  }
  console.log(`========================================\n`);
}

runTests()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

