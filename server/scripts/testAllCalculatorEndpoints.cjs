/**
 * End-to-end Verification Script for all Calculator functionality
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const PricingEngine = require('../services/pricingEngine');
const CalculatorRequestModel = require('../models/CalculatorRequestModel');
const db = require('../config/db');

async function verifyAll() {
  console.log('🚀 Running Full E2E Calculator Verification...\n');
  let failures = 0;

  function assert(cond, msg) {
    if (!cond) {
      console.error(`❌ FAIL: ${msg}`);
      failures++;
    } else {
      console.log(`✅ PASS: ${msg}`);
    }
  }

  // 1. Get Full Config
  console.log('--- 1. Testing getFullConfig() ---');
  const config = await PricingEngine.getFullConfig();
  assert(config.products.length >= 4, `Products count: ${config.products.length} (expected >= 4)`);
  assert(config.options.length >= 10, `Options count: ${config.options.length}`);
  assert(config.packagingItems.length >= 15, `Packaging items: ${config.packagingItems.length}`);
  assert(config.tiers.length >= 15, `Pricing tiers: ${config.tiers.length}`);

  // 2. Product 1 (Resin) Calculation
  console.log('\n--- 2. Product 1 (Gold Grade Shilajit Resin) ---');
  // 500 jars of 20g = 10,000g (10kg). Rate for 10kg-20kg is Rs.65/g. Product cost = 650,000.
  const resinCalc = await PricingEngine.calculate({
    productId: 1,
    fillSize: 20,
    finishedQuantity: 500,
    selectedPackagingIds: [3, 8, 11, 15, 17], // 20g Jar (130), Hook Spoon (40), Set Label (22), Brochure (15), Bleach Card Box (40)
    packagingPurchases: { 3: 600, 8: 500, 11: 500, 15: 500, 17: 500 }, // 600 jars purchased (100 remaining)
    additionalCosts: { printingCost: 2000, setupCost: 3000, otherCosts: 1000, shipping: 5000, discounts: 2000 }
  });

  assert(resinCalc.pricingAvailable === true, 'Resin calculation successful');
  assert(resinCalc.product.totalCost === 650000, `Resin product cost: ${resinCalc.product.totalCost}`);
  // Jars purchased = 600 @ 130 = 78,000; Spoons 500 @ 40 = 20,000; Labels 500 @ 22 = 11,000; Brochures 500 @ 15 = 7,500; Bleach Card Box 500 @ 40 = 20,000. Total packaging = 136,500.
  assert(resinCalc.summary.packagingInventoryCost === 136500, `Resin packaging inventory cost: ${resinCalc.summary.packagingInventoryCost} (expected 136500)`);
  // Remaining tracking check for Jars: 600 purchased - 500 used = 100 remaining
  const jarItem = resinCalc.packagingBreakdown.find(p => p.packagingId === 3);
  assert(jarItem.remainingQuantity === 100, `Jar remaining quantity: ${jarItem.remainingQuantity} (expected 100)`);
  // Master Formula: 650,000 + 136,500 + 2000 + 3000 + 1000 + 5000 - 2000 = 795,500
  assert(resinCalc.summary.estimatedProjectCost === 795500, `Master Formula total: ${resinCalc.summary.estimatedProjectCost} (expected 795500)`);

  // 3. Product 2 (Liquid Shilajit 30ml)
  console.log('\n--- 3. Product 2 (Liquid Shilajit 30ml) ---');
  // 100 bottles of 30ml = 3,000ml (<5L). Rate is Rs.70/ml. Product cost = 210,000.
  const liquidCalc = await PricingEngine.calculate({
    productId: 2,
    finishedQuantity: 100,
    selectedPackagingIds: [6, 14, 15, 17], // 30ml Dropper Bottle (160), Labels (22), Brochure (15), Bleach Card Box (60 for 200 MOQ)
    packagingPurchases: { 17: 200, 6: 200, 14: 200, 15: 200 } // meet MOQs
  });
  assert(liquidCalc.pricingAvailable === true, 'Liquid calculation successful');
  assert(liquidCalc.product.totalCost === 210000, `Liquid product cost: ${liquidCalc.product.totalCost} (expected 210,000)`);
  assert(liquidCalc.product.productUnit === 'ml', `Liquid product unit: ${liquidCalc.product.productUnit}`);

  // 4. Product 3 (Shilajit Capsules)
  console.log('\n--- 4. Product 3 (Shilajit Capsules) ---');
  // 10,000 capsules @ 200mg (Rs.45/capsule) = Rs.450,000.
  // Bottle size = 60 capsules -> Math.ceil(10,000 / 60) = 167 bottles.
  const capCalc = await PricingEngine.calculate({
    productId: 3,
    strength: '200mg',
    bottleSize: 60,
    finishedQuantity: 10000,
    selectedPackagingIds: [7, 15, 17], // PET Bottle (150), Brochure (15 for 200 MOQ), Bleach Card Box (60 for 200 MOQ)
    packagingPurchases: { 7: 200, 15: 200, 17: 200 }
  });
  assert(capCalc.pricingAvailable === true, 'Capsules calculation successful');
  assert(capCalc.product.totalCost === 450000, `Capsules product cost: ${capCalc.product.totalCost} (expected 450,000)`);
  const petBottle = capCalc.packagingBreakdown.find(p => p.packagingId === 7);
  assert(petBottle.suggestedQuantity === 167, `Capsule bottle suggested quantity: ${petBottle.suggestedQuantity} (expected 167)`);
  assert(petBottle.usedQuantity === 167, `Capsule bottle used quantity: ${petBottle.usedQuantity} (expected 167)`);
  assert(petBottle.remainingQuantity === 200 - 167, `Capsule bottle remaining: ${petBottle.remainingQuantity} (expected 33)`);

  // 5. Product 4 (Shilajit Tablets)
  console.log('\n--- 5. Product 4 (Shilajit Tablets) ---');
  // 500 blisters * 7 = 3500 tablets. Price = Rs.1,000/blister = Rs.500,000.
  const tabletCalc = await PricingEngine.calculate({
    productId: 4,
    finishedQuantity: 500,
    selectedPackagingIds: [17], // Bleach Card Box (500 @ 40 = 20,000)
    packagingPurchases: { 17: 500 }
  });
  assert(tabletCalc.pricingAvailable === true, 'Tablet calculation successful');
  assert(tabletCalc.product.totalCost === 500000, `Tablet product cost: ${tabletCalc.product.totalCost} (expected 500,000)`);
  assert(tabletCalc.product.productRequiredAmount === 3500, `Tablet total tablets: ${tabletCalc.product.productRequiredAmount} (expected 3,500)`);

  // 6. Capped tier exceeded / Missing price -> custom quotation message
  console.log('\n--- 6. Capped Tier & Missing Price Handling ---');
  const cappedResin = await PricingEngine.calculate({
    productId: 1,
    fillSize: 50,
    finishedQuantity: 20000 // 1,000,000g > 500kg capped limit
  });
  assert(cappedResin.pricingAvailable === false, 'Capped resin returns pricingAvailable: false');
  assert(cappedResin.message.includes('custom quotation'), `Message contains custom quotation prompt: "${cappedResin.message}"`);

  // 7. Save Configuration with Unique Reference
  console.log('\n--- 7. Save Configuration (Section 15) ---');
  const savedConfig = await PricingEngine.saveConfiguration({
    productId: 1,
    fillSize: 20,
    finishedQuantity: 500,
    customerName: 'Ahmad Khan',
    customerEmail: 'ahmad@example.com',
    customerPhone: '+92 300 0000000',
    selectedPackagingIds: [3, 8, 11, 15, 17],
    packagingPurchases: { 3: 500, 8: 500, 11: 500, 15: 500, 17: 500 }
  });
  assert(savedConfig.referenceNo && savedConfig.referenceNo.startsWith('PL-'), `Generated reference number: ${savedConfig.referenceNo}`);

  // Retrieve saved configuration
  const fetchedConfig = await PricingEngine.getConfigurationByReference(savedConfig.referenceNo);
  assert(fetchedConfig && fetchedConfig.reference_no === savedConfig.referenceNo, `Retrieved saved config ${fetchedConfig.reference_no}`);
  assert(fetchedConfig.product_name === 'Gold Grade Shilajit Resin', `Stored product name: ${fetchedConfig.product_name}`);
  assert(Array.isArray(fetchedConfig.packagingBreakdown), 'Packaging breakdown stored as parsed JSON');
  assert(fetchedConfig.pricingSnapshot && fetchedConfig.pricingSnapshot.calculatedAt, 'Pricing snapshot preserved');

  // 8. Submit Quotation Request
  console.log('\n--- 8. Quotation Request (Section 17) ---');
  const quoteReq = await CalculatorRequestModel.createRequest({
    referenceNo: savedConfig.referenceNo,
    customerName: 'Ahmad Khan',
    customerEmail: 'ahmad@example.com',
    customerPhone: '+92 300 0000000',
    productId: 1,
    productName: 'Gold Grade Shilajit Resin',
    packageType: 'Jar',
    fillSize: 20,
    finishedQuantity: 500,
    packagingId: 3,
    packagingName: '20g Resin Jar',
    packagingPurchaseQuantity: 500,
    productCost: 650000,
    packagingCost: 123500,
    estimatedProjectCost: 773500,
    configurationSnapshot: savedConfig
  });
  assert(quoteReq.id > 0, `Created quotation request ID #${quoteReq.id}`);

  // Fetch admin quotation requests
  const adminList = await CalculatorRequestModel.findAllWithUser();
  const foundInAdmin = adminList.find(q => q.id === quoteReq.id);
  assert(foundInAdmin !== undefined, 'Quotation request is visible in Admin quotation list');
  assert(foundInAdmin.reference_no === savedConfig.referenceNo, `Admin list contains reference_no: ${foundInAdmin.reference_no}`);

  console.log(`\n======================================================`);
  if (failures === 0) {
    console.log('🎉 ALL END-TO-END VERIFICATIONS PASSED WITH 100% SUCCESS!');
  } else {
    console.error(`❌ ${failures} test(s) failed.`);
  }
  console.log(`======================================================\n`);
}

verifyAll()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

