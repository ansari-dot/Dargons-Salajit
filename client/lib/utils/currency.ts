/**
 * Storefront prices are stored in the database in PKR (base currency).
 *
 * Visitors from Pakistan see the amount in PKR, every other country
 * sees the same amount converted to USD.
 */

export type CurrencyCode = 'PKR' | 'USD';

/**
 * Fallback PKR → USD exchange rate.
 * Override it without touching the code by adding the following line to
 * `client/.env.local`:
 *
 *   NEXT_PUBLIC_USD_TO_PKR_RATE=278
 */
export const USD_TO_PKR_RATE =
  Number(process.env.NEXT_PUBLIC_USD_TO_PKR_RATE) || 278;

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  PKR: '₨',
  USD: '$',
};

/**
 * Formats a base (PKR) amount for the given currency.
 *
 * PKR → always two decimals, e.g. `₨1,299.00` (same look as before)
 * USD → the product's own USD price when one is set in the admin panel,
 *       otherwise the amount converted with the PKR → USD rate, e.g. `$4.67`
 */
export const formatAmount = (
  amount: number | string | undefined | null,
  currency: string = 'PKR',
  usdAmount?: number | string | null
): string => {
  const value = Number(amount) || 0;

  if (currency === 'USD') {
    const explicitUsd = Number(usdAmount);
    const usd =
      usdAmount !== undefined &&
      usdAmount !== null &&
      usdAmount !== '' &&
      !isNaN(explicitUsd) &&
      explicitUsd > 0
        ? explicitUsd
        : value / USD_TO_PKR_RATE;

    return `$${usd.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return `₨${value.toLocaleString('en-US')}.00`;
};
