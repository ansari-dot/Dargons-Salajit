/**
 * Centralized Pricing & Validation Engine
 * Implements developer specification rules from:
 * "PRIVATE LABEL SHILAJIT - Configuration & Cost Calculator"
 */
const db = require('../config/db');

class PricingEngine {
  /**
   * Look up tier pricing from calculator_pricing_tiers.
   * NEVER guesses missing prices.
   * NEVER interpolates between tiers.
   * NEVER automatically extends capped tiers.
   * NEVER automatically reduces open-ended prices.
   */
  static async findTierPrice(entityType, entityId, quantity) {
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return {
        available: false,
        message: 'Quantity must be a positive number.'
      };
    }

    const [tiers] = await db.query(
      `
      SELECT *
      FROM calculator_pricing_tiers
      WHERE entity_type = ?
        AND entity_id = ?
        AND is_active = 1
        AND (effective_from IS NULL OR effective_from <= CURRENT_DATE)
        AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
      ORDER BY min_quantity ASC
      `,
      [entityType, entityId]
    );

    if (!tiers || tiers.length === 0) {
      return {
        available: false,
        message: 'Pricing is currently unavailable for this item. Please contact us for a custom quotation.'
      };
    }

    // Match exact tier
    for (const tier of tiers) {
      const min = Number(tier.min_quantity);
      const max = tier.max_quantity !== null ? Number(tier.max_quantity) : null;
      const isOpenEnded = Boolean(tier.is_open_ended);

      if (isOpenEnded) {
        if (qty >= min) {
          return {
            available: true,
            rate: Number(tier.rate),
            minQuantity: min,
            maxQuantity: null,
            isOpenEnded: true,
            tierId: tier.id,
            pricingVersion: tier.pricing_version
          };
        }
      } else if (max !== null) {
        if (qty >= min && qty <= max) {
          return {
            available: true,
            rate: Number(tier.rate),
            minQuantity: min,
            maxQuantity: max,
            isOpenEnded: false,
            tierId: tier.id,
            pricingVersion: tier.pricing_version
          };
        }
      }
    }

    // No tier matched -> Do not guess, do not interpolate, do not extend capped tiers!
    return {
      available: false,
      message: 'Pricing is currently unavailable for this quantity. Please contact us for a custom quotation.'
    };
  }

  /**
   * Load active products, options, packaging items, rules, and tiers for frontend
   */
  static async getFullConfig() {
    const [products] = await db.query(`
      SELECT * FROM calculator_products WHERE is_active = 1 ORDER BY id ASC
    `);

    const [options] = await db.query(`
      SELECT * FROM calculator_product_options_v2 WHERE is_active = 1 ORDER BY product_id, sort_order ASC
    `);

    const [packagingItems] = await db.query(`
      SELECT * FROM calculator_packaging_items WHERE is_active = 1 ORDER BY type, id ASC
    `);

    const [rules] = await db.query(`
      SELECT r.*, p.name AS packaging_name, p.code AS packaging_code, p.type AS packaging_type,
             p.moq, p.unit_price, p.dieline_url, p.capacity
      FROM calculator_product_packaging_rules r
      INNER JOIN calculator_packaging_items p ON p.id = r.packaging_id
      WHERE r.is_active = 1 AND p.is_active = 1
      ORDER BY r.product_id, r.component_type, r.alternative_group, p.id
    `);

    const [tiers] = await db.query(`
      SELECT * FROM calculator_pricing_tiers WHERE is_active = 1 ORDER BY entity_type, entity_id, min_quantity ASC
    `);

    return {
      products,
      options,
      packagingItems,
      rules,
      tiers
    };
  }

  /**
   * Calculate complete configuration with backend authoritative validation
   */
  static async calculate(payload) {
    const {
      productId,
      fillSize,        // number (g or ml) or label
      strength,        // string e.g. '200mg' or '400mg'
      bottleSize,      // number e.g. 30, 60, 90 capsules
      finishedQuantity,// integer > 0
      selectedPackagingIds = [], // array of selected packaging item IDs
      packagingPurchases = {},   // map of packagingId -> purchasedQuantity
      additionalCosts = {}
    } = payload;

    // 1. Validate Product
    const [prodRows] = await db.query(
      `SELECT * FROM calculator_products WHERE id = ? AND is_active = 1 LIMIT 1`,
      [productId]
    );
    if (prodRows.length === 0) {
      throw new Error('Valid active product is required.');
    }
    const product = prodRows[0];

    // 2. Validate Finished Quantity
    const qty = Number(finishedQuantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new Error('Finished quantity must be a positive whole number.');
    }

    // 3. Product-Specific Calculations & MOQ Validation
    let productRequiredAmount = 0;
    let productUnit = '';
    let productUnitPrice = 0;
    let productCost = 0;
    let pricingTierInfo = null;
    let containerQuantityMultiplier = 1;

    if (product.id === 1) {
      // PRODUCT 1 — GOLD GRADE SHILAJIT RESIN
      // Fill Sizes: 10, 15, 20, 30, 50g
      const numFill = Number(fillSize);
      const validFills = [10, 15, 20, 30, 50];
      if (!validFills.includes(numFill)) {
        throw new Error(`Invalid fill size for Resin. Allowed: ${validFills.join(', ')}g`);
      }

      // Required Grams = Filled Units × Fill Size
      const requiredGrams = qty * numFill;
      productRequiredAmount = requiredGrams;
      productUnit = 'g';

      // Minimum: 1kg = 1,000g
      if (requiredGrams < 1000) {
        throw new Error('Minimum order quantity for Gold Grade Shilajit Resin is 1kg (1,000g). Current: ' + requiredGrams + 'g.');
      }

      const tierLookup = await this.findTierPrice('product', 1, requiredGrams);
      if (!tierLookup.available) {
        return {
          pricingAvailable: false,
          message: tierLookup.message || 'Pricing is currently unavailable for this quantity. Please contact us for a custom quotation.',
          productRequiredAmount,
          productUnit
        };
      }

      productUnitPrice = tierLookup.rate;
      productCost = requiredGrams * productUnitPrice;
      pricingTierInfo = tierLookup;
      containerQuantityMultiplier = 1; // 1 jar per finished unit

    } else if (product.id === 2) {
      // PRODUCT 2 — LIQUID SHILAJIT 30ML
      // Container: 30ml Dropper Bottle (Do not use "Serum Bottle")
      const numFill = 30; // 30ml fixed
      const totalMl = qty * numFill;
      productRequiredAmount = totalMl;
      productUnit = 'ml';

      const tierLookup = await this.findTierPrice('product', 2, totalMl);
      if (!tierLookup.available) {
        return {
          pricingAvailable: false,
          message: tierLookup.message || 'Pricing is currently unavailable for this quantity. Please contact us for a custom quotation.',
          productRequiredAmount,
          productUnit
        };
      }

      productUnitPrice = tierLookup.rate;
      productCost = totalMl * productUnitPrice;
      pricingTierInfo = tierLookup;
      containerQuantityMultiplier = 1; // 1 bottle per finished unit

    } else if (product.id === 3) {
      // PRODUCT 3 — SHILAJIT CAPSULES
      // MOQ: 10,000 capsules
      if (qty < 10000) {
        throw new Error('Minimum order quantity for Shilajit Capsules is 10,000 capsules.');
      }

      // Strengths: 200mg (Rs.45/capsule), 400mg (Rs.85/capsule)
      let pricePerCapsule = 0;
      const strStr = String(strength || '').toLowerCase().trim();
      if (strStr === '200mg' || strStr === '200') {
        pricePerCapsule = 45.00;
      } else if (strStr === '400mg' || strStr === '400') {
        pricePerCapsule = 85.00;
      } else {
        throw new Error('Invalid capsule strength. Choose 200mg or 400mg.');
      }

      productRequiredAmount = qty;
      productUnit = 'capsules';
      productUnitPrice = pricePerCapsule;
      productCost = qty * pricePerCapsule;

      // Customer selects bottle size: 30, 60, 90 capsules
      const numBottleSize = Number(bottleSize) || 60;
      if (![30, 60, 90].includes(numBottleSize)) {
        throw new Error('Invalid capsule bottle size. Allowed: 30, 60, or 90 capsules.');
      }

      // Bottle Formula: Required Bottles = Total Capsules ÷ Capsules Per Bottle, round up
      const requiredBottles = Math.ceil(qty / numBottleSize);
      containerQuantityMultiplier = requiredBottles; // suggested packaging units = requiredBottles

    } else if (product.id === 4) {
      // PRODUCT 4 — SHILAJIT TABLETS
      // 1 Blister = 7 Tablets. MOQ = 500 blisters. Price = Rs.1,000/blister.
      // Minimum product cost = Rs.500,000.
      if (qty < 500) {
        throw new Error('Minimum order quantity for Shilajit Tablets is 500 blisters.');
      }

      const blisterPrice = 1000.00;
      productRequiredAmount = qty * 7; // total tablets
      productUnit = 'blisters';
      productUnitPrice = blisterPrice;
      productCost = qty * blisterPrice;

      if (productCost < 500000) {
        throw new Error('Product 4 minimum product cost is Rs. 500,000.');
      }

      containerQuantityMultiplier = qty; // 1 box per blister
    }

    // 4. Resolve Packaging Components & Compatibility Validation
    const [rules] = await db.query(`
      SELECT r.*, p.id AS pkg_id, p.name AS pkg_name, p.code AS pkg_code, p.type AS pkg_type,
             p.moq, p.unit_price, p.material_cost, p.printing_cost, p.setup_cost, p.other_cost,
             p.dieline_url, p.capacity
      FROM calculator_product_packaging_rules r
      INNER JOIN calculator_packaging_items p ON p.id = r.packaging_id
      WHERE r.product_id = ? AND r.is_active = 1 AND p.is_active = 1
    `, [product.id]);

    // Group rules by component_type and alternative_group
    const requiredItems = [];
    const alternativeGroups = {};

    for (const r of rules) {
      if (r.component_type === 'required') {
        // Special case: For Resin, Jar must match fillSize!
        if (product.id === 1 && r.pkg_type === 'container') {
          const jarFill = Number(fillSize) || 20;
          if (r.pkg_name.includes(`${jarFill}g`)) {
            requiredItems.push(r);
          }
        } else {
          requiredItems.push(r);
        }
      } else if (r.component_type === 'alternative') {
        const groupKey = r.alternative_group || 'default_alt';
        if (!alternativeGroups[groupKey]) {
          alternativeGroups[groupKey] = [];
        }
        alternativeGroups[groupKey].push(r);
      }
    }

    // Determine final selected packaging items
    const finalSelectedPackaging = [];

    // Add all required components
    for (const req of requiredItems) {
      finalSelectedPackaging.push(req);
    }

    // For each alternative group: exactly ONE must be selected
    for (const [groupName, groupOptions] of Object.entries(alternativeGroups)) {
      // Find if user selected one from this group
      let selectedFromGroup = groupOptions.find((opt) =>
        selectedPackagingIds.map(Number).includes(Number(opt.pkg_id))
      );

      // If not selected, fallback to the default in that group
      if (!selectedFromGroup) {
        selectedFromGroup = groupOptions.find((opt) => opt.is_default) || groupOptions[0];
      }

      if (selectedFromGroup) {
        finalSelectedPackaging.push(selectedFromGroup);
      }
    }

    // 5. Calculate Packaging Costs & Tracking (Suggested, Purchased, Used, Remaining)
    const packagingBreakdown = [];
    let totalPackagingCost = 0;
    let totalPurchasedPackagingUnits = 0;

    for (const item of finalSelectedPackaging) {
      // Calculate Suggested Quantity based on suggested_qty_rule
      let suggestedQty = qty;
      if (product.id === 3) {
        // For capsules, suggested container/box/brochure is requiredBottles
        suggestedQty = containerQuantityMultiplier;
      } else if (product.id === 4) {
        // For tablets, blister is tablet unit, Bleach Card Box is external packaging
        suggestedQty = qty;
      } else {
        suggestedQty = qty;
      }

      // Purchased Quantity (Rule: customer may purchase more packaging than immediately required)
      const enteredPurchased = packagingPurchases[item.pkg_id];
      const purchasedQty = enteredPurchased !== undefined && Number(enteredPurchased) > 0
        ? Math.floor(Number(enteredPurchased))
        : suggestedQty;

      // Validate MOQ (Rule 9 & Rule 28: Unspecified packaging MOQ defaults to 200 pieces; database specific takes priority)
      const itemMOQ = item.moq || 200;
      if (purchasedQty < itemMOQ) {
        throw new Error(`Purchased quantity for "${item.pkg_name}" is ${purchasedQty}, which is below the minimum order quantity (MOQ: ${itemMOQ}).`);
      }

      // Used Quantity = Suggested Quantity
      const usedQty = suggestedQty;

      // Formula from Section 3: Remaining = Purchased - Used
      const remainingQty = purchasedQty - usedQty;

      // Packaging Pricing: Fixed Unit Price OR Tiered Pricing
      let unitPrice = 0;
      let pricingDetail = null;

      if (item.unit_price !== null && item.unit_price !== undefined) {
        unitPrice = Number(item.unit_price);
      } else {
        // Tiered pricing lookup for packaging
        const tierLookup = await this.findTierPrice('packaging', item.pkg_id, purchasedQty);
        if (!tierLookup.available) {
          return {
            pricingAvailable: false,
            message: `Pricing is currently unavailable for ${item.pkg_name} at quantity ${purchasedQty}. Please contact us for a custom quotation.`,
            failedItem: item.pkg_name,
            purchasedQty
          };
        }
        unitPrice = tierLookup.rate;
        pricingDetail = tierLookup;
      }

      // Packaging is charged according to Purchased Quantity, not used quantity (Rule 4)
      const itemCost = unitPrice * purchasedQty;
      totalPackagingCost += itemCost;
      totalPurchasedPackagingUnits += purchasedQty;

      packagingBreakdown.push({
        packagingId: item.pkg_id,
        name: item.pkg_name,
        code: item.pkg_code,
        type: item.pkg_type,
        alternativeGroup: item.alternative_group || null,
        moq: itemMOQ,
        suggestedQuantity: suggestedQty,
        purchasedQuantity: purchasedQty,
        usedQuantity: usedQty,
        remainingQuantity: remainingQty,
        unitPrice: unitPrice,
        totalCost: itemCost,
        dielineUrl: item.dieline_url || null,
        capacity: item.capacity || null,
        pricingTier: pricingDetail
      });
    }

    // 6. Master Formula Breakdown
    const printing = Math.max(0, Number(additionalCosts.printingCost) || 0);
    const setup = Math.max(0, Number(additionalCosts.setupCost) || 0);
    const other = Math.max(0, Number(additionalCosts.otherCosts) || 0);
    const shippingCost = Math.max(0, Number(additionalCosts.shipping) || 0);
    const discountsAmount = Math.max(0, Number(additionalCosts.discounts || additionalCosts.discount) || 0);

    // Master Formula:
    // Product Cost + Packaging Cost + Printing + Setup + Other Costs + Shipping - Discounts = Estimated Project Cost
    const estimatedProjectCost = Math.max(
      0,
      productCost + totalPackagingCost + printing + setup + other + shippingCost - discountsAmount
    );

    // Per unit metrics
    const filledProductCostPerUnit = qty > 0 ? (productCost / qty) : 0;
    const packagingCostPerPurchasedUnit = totalPurchasedPackagingUnits > 0
      ? (totalPackagingCost / totalPurchasedPackagingUnits)
      : 0;

    return {
      pricingAvailable: true,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        fillSize: fillSize || null,
        strength: strength || null,
        bottleSize: bottleSize || null,
        finishedQuantity: qty,
        productRequiredAmount,
        productUnit,
        unitPrice: productUnitPrice,
        totalCost: productCost,
        costPerUnit: filledProductCostPerUnit,
        tierInfo: pricingTierInfo
      },
      packagingBreakdown,
      additionalCosts: {
        printingCost: printing,
        setupCost: setup,
        otherCosts: other,
        shipping: shippingCost,
        discounts: discountsAmount
      },
      summary: {
        filledProductCost: productCost,
        packagingInventoryCost: totalPackagingCost,
        printingCost: printing,
        setupCost: setup,
        otherCosts: other,
        shipping: shippingCost,
        discounts: discountsAmount,
        estimatedProjectCost: estimatedProjectCost,
        filledProductCostPerUnit: filledProductCostPerUnit,
        packagingCostPerPurchasedUnit: packagingCostPerPurchasedUnit,
        totalPurchasedPackagingUnits
      },
      pricingSnapshot: {
        calculatedAt: new Date().toISOString(),
        productTier: pricingTierInfo,
        productUnitPrice,
        packagingItems: packagingBreakdown.map((p) => ({
          id: p.packagingId,
          name: p.name,
          purchasedQty: p.purchasedQuantity,
          unitPrice: p.unitPrice,
          totalCost: p.totalCost
        }))
      }
    };
  }

  /**
   * Save a configuration with a unique reference number
   * e.g. PL-2026-000124
   */
  static async saveConfiguration(data) {
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const referenceNo = `PL-${year}-${randomSuffix}`;

    const calculation = await this.calculate(data);
    if (!calculation.pricingAvailable) {
      throw new Error(calculation.message || 'Pricing unavailable. Configuration cannot be calculated.');
    }

    const {
      userId,
      customerName,
      customerEmail,
      customerPhone
    } = data;

    const [result] = await db.query(`
      INSERT INTO calculator_saved_configurations (
        reference_no, user_id, customer_name, customer_email, customer_phone,
        product_id, product_name, fill_size, strength, bottle_size, finished_quantity,
        product_required_amount, product_unit, product_unit_price, product_cost,
        packaging_cost, printing_cost, setup_cost, other_costs, shipping, discounts,
        estimated_project_cost, packaging_breakdown, pricing_snapshot, status
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, 'saved'
      )
    `, [
      referenceNo,
      userId || null,
      customerName || null,
      customerEmail || null,
      customerPhone || null,
      calculation.product.id,
      calculation.product.name,
      String(calculation.product.fillSize || ''),
      String(calculation.product.strength || ''),
      String(calculation.product.bottleSize || ''),
      calculation.product.finishedQuantity,
      calculation.product.productRequiredAmount,
      calculation.product.productUnit,
      calculation.product.unitPrice,
      calculation.summary.filledProductCost,
      calculation.summary.packagingInventoryCost,
      calculation.summary.printingCost,
      calculation.summary.setupCost,
      calculation.summary.otherCosts,
      calculation.summary.shipping,
      calculation.summary.discounts,
      calculation.summary.estimatedProjectCost,
      JSON.stringify(calculation.packagingBreakdown),
      JSON.stringify(calculation.pricingSnapshot)
    ]);

    return {
      id: result.insertId,
      referenceNo,
      ...calculation
    };
  }

  /**
   * Fetch saved configuration by reference number
   */
  static async getConfigurationByReference(referenceNo) {
    const [rows] = await db.query(`
      SELECT * FROM calculator_saved_configurations WHERE reference_no = ? LIMIT 1
    `, [referenceNo]);

    if (rows.length === 0) return null;
    const row = rows[0];

    return {
      ...row,
      packagingBreakdown: typeof row.packaging_breakdown === 'string'
        ? JSON.parse(row.packaging_breakdown)
        : row.packaging_breakdown,
      pricingSnapshot: typeof row.pricing_snapshot === 'string'
        ? JSON.parse(row.pricing_snapshot)
        : row.pricing_snapshot
    };
  }
}

module.exports = PricingEngine;

