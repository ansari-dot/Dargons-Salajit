/**
 * Delivery (shipping) charge rules for the storefront.
 *
 * Every amount is calculated in PKR because that is the base currency of the
 * store (same reason product prices are stored in PKR) and only converted for
 * display with `formatAmount(amount, currency)`.
 *
 *   • Pakistan             → flat Normal ₨300 / Urgent ₨500
 *   • Every other country  → the courier charge is entered in USD on checkout
 *                            and converted back to PKR for storage
 */

import { USD_TO_PKR_RATE } from './currency';

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
 * Single source of truth for the delivery charge (PKR) of an order.
 * Pakistan → flat 300 / 500. Other customers → the USD amount they entered.
 */
export const resolveDeliveryCharge = (options: {
  isPakistan: boolean;
  deliveryType: DeliveryType | string;
  internationalChargeUsd?: number | string | null;
}): number => {
  if (options.isPakistan) {
    return getPakistanDeliveryCharge(options.deliveryType);
  }
  return usdToPkrAmount(options.internationalChargeUsd);
};

/** Human readable delivery speed used in order summaries and admin screens. */
export const getDeliveryTypeLabel = (deliveryType: DeliveryType | string): string =>
  String(deliveryType).toLowerCase() === 'urgent' ? 'Urgent Delivery' : 'Normal Delivery';
