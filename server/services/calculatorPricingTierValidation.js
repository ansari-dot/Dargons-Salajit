const isPositiveFiniteNumber = (value) => (
  value !== null &&
  value !== undefined &&
  value !== '' &&
  Number.isFinite(Number(value)) &&
  Number(value) > 0
);

const isOpenEndedValue = (value) => value === true || value === 1 || value === '1';

const validatePricingTier = ({
  entityType,
  entityId,
  minQuantity,
  maxQuantity,
  rate,
  isOpenEnded,
  effectiveFrom,
  effectiveUntil
}) => {
  if (!['product', 'packaging'].includes(entityType)) {
    return 'Tier entity type must be product or packaging.';
  }
  if (!Number.isInteger(Number(entityId)) || Number(entityId) <= 0) {
    return 'Tier entity ID must be a positive whole number.';
  }
  if (!isPositiveFiniteNumber(minQuantity)) {
    return 'Minimum quantity must be a positive number.';
  }
  if (!isPositiveFiniteNumber(rate)) {
    return 'Tier rate must be a positive number.';
  }

  const openEnded = isOpenEndedValue(isOpenEnded);
  if (entityType === 'packaging' && !Number.isInteger(Number(minQuantity))) {
    return 'Packaging tier quantities must be whole numbers.';
  }

  if (openEnded) {
    if (maxQuantity !== null && maxQuantity !== undefined && maxQuantity !== '') {
      return 'Open-ended tiers must not have a maximum quantity.';
    }
  } else {
    if (!isPositiveFiniteNumber(maxQuantity)) {
      return 'Maximum quantity must be a positive number for capped tiers.';
    }
    if (Number(maxQuantity) < Number(minQuantity)) {
      return 'Maximum quantity must be greater than or equal to minimum quantity.';
    }
    if (entityType === 'packaging' && !Number.isInteger(Number(maxQuantity))) {
      return 'Packaging tier quantities must be whole numbers.';
    }
  }

  if (effectiveFrom && effectiveUntil && effectiveFrom > effectiveUntil) {
    return 'Effective start date must be on or before the end date.';
  }

  return null;
};

const dateRangesOverlap = (leftStart, leftEnd, rightStart, rightEnd) => (
  (!leftEnd || !rightStart || leftEnd >= rightStart) &&
  (!rightEnd || !leftStart || rightEnd >= leftStart)
);

const findOverlappingTier = (candidate, existingTiers) => {
  const candidateMin = Number(candidate.minQuantity);
  const candidateMax = isOpenEndedValue(candidate.isOpenEnded)
    ? Infinity
    : Number(candidate.maxQuantity);

  return existingTiers.find((tier) => {
    if (candidate.id !== undefined && Number(tier.id) === Number(candidate.id)) {
      return false;
    }

    const tierMin = Number(tier.min_quantity);
    const tierMax = tier.is_open_ended || tier.max_quantity === null
      ? Infinity
      : Number(tier.max_quantity);
    const quantityRangesOverlap = candidateMin <= tierMax && tierMin <= candidateMax;

    return quantityRangesOverlap && dateRangesOverlap(
      candidate.effectiveFrom || null,
      candidate.effectiveUntil || null,
      tier.effective_from || null,
      tier.effective_until || null
    );
  });
};

module.exports = {
  findOverlappingTier,
  isOpenEndedValue,
  validatePricingTier
};
