/**
 * Delivery (shipping) charge rules for the storefront.
 *
 * Every amount is calculated in PKR because that is the base currency of the
 * store (same reason product prices are stored in PKR) and only converted for
 * display with `formatAmount(amount, currency)`.
 *
 *   • Pakistan             → flat Normal ₨300 / Urgent ₨500
 *   • Every other country  → the courier charge quoted for the customer's
 *                            country, entered in THEIR display currency
 *                            (USD, AED, SAR, QAR, …) and stored back in PKR
 */

import {
  USD_TO_PKR_RATE,
  fromPkr,
  getCurrencyDecimals,
  toPkr,
} from './currency';

export type DeliveryType = 'normal' | 'urgent';

/** Flat delivery charge for a normal delivery inside Pakistan (PKR). */
export const PAKISTAN_DELIVERY_CHARGE = 300;

/** Priority delivery charge for an urgent delivery inside Pakistan (PKR). */
export const PAKISTAN_URGENT_DELIVERY_CHARGE = 500;

/** Default courier charge quoted to customers outside Pakistan (USD). */
export const INTERNATIONAL_DEFAULT_DELIVERY_USD = 24;

export const DELIVERY_TYPES: {
  value: DeliveryType;
  label: string;
  description: string;
}[] = [
  {
    value: 'normal',
    label: 'Normal Delivery',
    description: 'Standard courier · delivers within 2-4 business days',
  },
  {
    value: 'urgent',
    label: 'Urgent Delivery',
    description: 'Priority dispatch · delivers within 24 hours',
  },
];

/** Rounds a display amount to the decimals the currency actually uses. */
export const roundForCurrency = (
  value: number,
  currency?: string | null
): number => {
  const factor = Math.pow(10, getCurrencyDecimals(currency));
  return Math.round((Number(value) || 0) * factor) / factor;
};

/**
 * Pakistan (and an undetected country, which keeps the PKR fallback used by
 * `uiSlice`) uses the flat Pakistani delivery charges.
 */
export const isPakistanCustomer = (countryCode?: string | null): boolean => {
  const code = String(countryCode || '').trim().toUpperCase();
  return code === '' || code === 'PK';
};

/** Flat charge for a delivery inside Pakistan, based on the selected speed. */
export const getPakistanDeliveryCharge = (deliveryType: DeliveryType | string): number =>
  String(deliveryType).toLowerCase() === 'urgent'
    ? PAKISTAN_URGENT_DELIVERY_CHARGE
    : PAKISTAN_DELIVERY_CHARGE;

/** Converts a USD amount entered for an international order into PKR. */
export const usdToPkrAmount = (usd: number | string | undefined | null): number => {
  const value = Number(usd) || 0;
  if (value <= 0) return 0;
  return Math.round(value * USD_TO_PKR_RATE * 100) / 100;
};

/**
 * The store's default international courier charge (USD 24) expressed in the
 * customer's own currency, e.g. `AED 86.27` for a UAE visitor.
 */
export const defaultInternationalCharge = (currency?: string | null): number =>
  roundForCurrency(
    fromPkr(usdToPkrAmount(INTERNATIONAL_DEFAULT_DELIVERY_USD), currency),
    currency
  );

/**
 * Single source of truth for the delivery charge (PKR) of an order.
 *
 *   Pakistan → flat 300 / 500.
 *   Other customers → the charge they entered in THEIR currency,
 *   converted back to PKR (because that is what the order stores).
 *
 * `internationalChargeUsd` is still accepted for backwards compatibility with
 * callers that used the old USD-only field.
 */
export const resolveDeliveryCharge = (options: {
  isPakistan: boolean;
  deliveryType: DeliveryType | string;
  /** Charge in the customer's display currency (preferred) */
  internationalCharge?: number | string | null;
  /** Display currency of `internationalCharge` (defaults to PKR) */
  currency?: string | null;
  /** Legacy: charge already expressed in USD */
  internationalChargeUsd?: number | string | null;
}): number => {
  if (options.isPakistan) {
    return getPakistanDeliveryCharge(options.deliveryType);
  }

  // Legacy callers that still pass a USD amount.
  if (
    options.internationalCharge === undefined &&
    options.internationalChargeUsd !== undefined
  ) {
    return usdToPkrAmount(options.internationalChargeUsd);
  }

  const value = Number(options.internationalCharge) || 0;
  if (value <= 0) return 0;

  return Math.round(toPkr(value, options.currency) * 100) / 100;
};

/** Human readable delivery speed used in order summaries and admin screens. */
export const getDeliveryTypeLabel = (deliveryType: DeliveryType | string): string =>
  String(deliveryType).toLowerCase() === 'urgent' ? 'Urgent Delivery' : 'Normal Delivery';