const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  findOverlappingTier,
  validatePricingTier
} = require('../services/calculatorPricingTierValidation');

const packagingTier = (overrides = {}) => ({
  entityType: 'packaging',
  entityId: 17,
  minQuantity: 201,
  maxQuantity: 500,
  rate: 70,
  isOpenEnded: false,
  ...overrides
});

test('validates whole packaging quantities and required capped ranges', () => {
  assert.equal(validatePricingTier(packagingTier()), null);
  assert.match(validatePricingTier(packagingTier({ minQuantity: 201.5 })), /whole numbers/);
  assert.match(validatePricingTier(packagingTier({ maxQuantity: null })), /maximum quantity/i);
  assert.match(validatePricingTier(packagingTier({ maxQuantity: 200 })), /greater than or equal/);
});

test('validates open-ended tiers without a maximum', () => {
  assert.equal(validatePricingTier(packagingTier({
    minQuantity: 1001,
    maxQuantity: null,
    isOpenEnded: true
  })), null);
  assert.match(validatePricingTier(packagingTier({
    maxQuantity: 500,
    isOpenEnded: true
  })), /must not have a maximum/);
});

test('rejects overlapping active tiers but permits adjacent and date-disjoint tiers', () => {
  const existing = [{
    id: 1,
    min_quantity: 100,
    max_quantity: 200,
    is_open_ended: 0,
    effective_from: null,
    effective_until: null
  }];
  assert.equal(findOverlappingTier(packagingTier({ minQuantity: 200 }), existing)?.id, 1);
  assert.equal(findOverlappingTier(packagingTier({ minQuantity: 201 }), existing), undefined);
  assert.equal(findOverlappingTier(packagingTier({
    minQuantity: 100,
    maxQuantity: 200,
    effectiveFrom: '2027-01-01',
    effectiveUntil: '2027-12-31'
  }), [{
    ...existing[0],
    effective_from: '2026-01-01',
    effective_until: '2026-12-31'
  }]), undefined);
});
