/**
 * Storefront currency system.
 *
 * Every price in the database is stored in PKR (the store's BASE currency) and
 * only converted for display:
 *
 *   Pakistan             → PKR (base, no conversion)
 *   Arab League country  → that country's local currency (AED, SAR, QAR, KWD,
 *                          BHD, OMR, JOD, EGP, …) with its proper NAME + symbol
 *   Every other country  → USD
 *
 * Rates mean "units of the currency for 1 PKR" and come from the backend
 * (`GET /api/location?ip=…` → `location.exchangeRate` / `location.rates`).
 * The static table below is only an offline fallback so prices still render
 * when the rate API is unreachable.
 */

/**
 * Fallback PKR → USD rate.
 * Override it without touching the code by adding the following line to
 * `client/.env.local`:
 *
 *   NEXT_PUBLIC_USD_TO_PKR_RATE=278
 */
export const USD_TO_PKR_RATE =
  Number(process.env.NEXT_PUBLIC_USD_TO_PKR_RATE) || 278;

export interface CurrencyMeta {
  /** ISO 4217 code, e.g. 'AED' */
  code: string;
  /** Human readable name, e.g. 'UAE Dirham' */
  name: string;
  /** Short symbol: '₨', '$', '₪' … or the code when there is no unique glyph */
  symbol: string;
  /** ISO 4217 minor units — KWD/BHD/OMR/JOD/… use 3, DJF/KMF use 0 */
  decimals: number;
}

/**
 * Every currency the storefront can display.
 * Must stay in sync with `CURRENCY_NAMES` in
 * `server/services/currencyExchange.service.js`.
 */
export const CURRENCY_META: Record<string, CurrencyMeta> = {
  PKR: { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', decimals: 2 },
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2 },

  // ── Arab League currencies ────────────────────────────────────────────────
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'AED', decimals: 2 },
  SAR: { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', decimals: 2 },
  QAR: { code: 'QAR', name: 'Qatari Riyal', symbol: 'QAR', decimals: 2 },
  KWD: { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KWD', decimals: 3 },
  BHD: { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BHD', decimals: 3 },
  OMR: { code: 'OMR', name: 'Omani Rial', symbol: 'OMR', decimals: 3 },
  JOD: { code: 'JOD', name: 'Jordanian Dinar', symbol: 'JOD', decimals: 3 },
  IQD: { code: 'IQD', name: 'Iraqi Dinar', symbol: 'IQD', decimals: 3 },
  LYD: { code: 'LYD', name: 'Libyan Dinar', symbol: 'LYD', decimals: 3 },
  TND: { code: 'TND', name: 'Tunisian Dinar', symbol: 'TND', decimals: 3 },
  EGP: { code: 'EGP', name: 'Egyptian Pound', symbol: 'EGP', decimals: 2 },
  LBP: { code: 'LBP', name: 'Lebanese Pound', symbol: 'LBP', decimals: 2 },
  SYP: { code: 'SYP', name: 'Syrian Pound', symbol: 'SYP', decimals: 2 },
  YER: { code: 'YER', name: 'Yemeni Rial', symbol: 'YER', decimals: 2 },
  MAD: { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD', decimals: 2 },
  DZD: { code: 'DZD', name: 'Algerian Dinar', symbol: 'DZD', decimals: 2 },
  SDG: { code: 'SDG', name: 'Sudanese Pound', symbol: 'SDG', decimals: 2 },
  ILS: { code: 'ILS', name: 'Israeli New Shekel', symbol: '₪', decimals: 2 },
  MRU: { code: 'MRU', name: 'Mauritanian Ouguiya', symbol: 'MRU', decimals: 2 },
  SOS: { code: 'SOS', name: 'Somali Shilling', symbol: 'SOS', decimals: 2 },
  DJF: { code: 'DJF', name: 'Djiboutian Franc', symbol: 'DJF', decimals: 0 },
  KMF: { code: 'KMF', name: 'Comorian Franc', symbol: 'KMF', decimals: 0 },
};

/** ISO 4217 code of any currency the storefront supports. */
export type CurrencyCode = keyof typeof CURRENCY_META;

/** Ordered list used by the currency dropdown in the header. */
export const SUPPORTED_CURRENCIES: CurrencyCode[] = [
  'PKR',
  'USD',
  'AED',
  'SAR',
  'QAR',
  'KWD',
  'BHD',
  'OMR',
  'JOD',
  'EGP',
  'IQD',
  'MAD',
  'TND',
  'DZD',
  'LYD',
  'SDG',
  'YER',
  'SYP',
  'LBP',
  'ILS',
  'MRU',
  'SOS',
  'DJF',
  'KMF',
];

/** Legacy export kept for backwards compatibility. */
export const CURRENCY_SYMBOLS: Record<string, string> = Object.fromEntries(
  Object.entries(CURRENCY_META).map(([code, meta]) => [code, meta.symbol])
);

/** ISO 3166-1 alpha-2 country code → ISO 4217 currency code. */
export const COUNTRY_CURRENCY: Record<string, CurrencyCode> = {
  // ── Pakistan (the store's base currency) ──────────────────────────────────
  PK: 'PKR',

  // ── Arab League countries ─────────────────────────────────────────────────
  AE: 'AED', // United Arab Emirates — UAE Dirham
  SA: 'SAR', // Saudi Arabia         — Saudi Riyal
  QA: 'QAR', // Qatar                — Qatari Riyal
  KW: 'KWD', // Kuwait               — Kuwaiti Dinar
  BH: 'BHD', // Bahrain              — Bahraini Dinar
  OM: 'OMR', // Oman                 — Omani Rial
  JO: 'JOD', // Jordan               — Jordanian Dinar
  LB: 'LBP', // Lebanon              — Lebanese Pound
  SY: 'SYP', // Syria                — Syrian Pound
  IQ: 'IQD', // Iraq                 — Iraqi Dinar
  PS: 'ILS', // Palestine            — Israeli New Shekel
  EG: 'EGP', // Egypt                — Egyptian Pound
  LY: 'LYD', // Libya                — Libyan Dinar
  TN: 'TND', // Tunisia              — Tunisian Dinar
  DZ: 'DZD', // Algeria              — Algerian Dinar
  MA: 'MAD', // Morocco              — Moroccan Dirham
  EH: 'MAD', // Western Sahara       — Moroccan Dirham
  SD: 'SDG', // Sudan                — Sudanese Pound
  YE: 'YER', // Yemen                — Yemeni Rial
  MR: 'MRU', // Mauritania           — Mauritanian Ouguiya
  SO: 'SOS', // Somalia              — Somali Shilling
  DJ: 'DJF', // Djibouti             — Djiboutian Franc
  KM: 'KMF', // Comoros              — Comorian Franc
};

/** Country codes that make up the Arab world. */
export const ARAB_COUNTRY_CODES = [
  'AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'JO', 'LB', 'SY', 'IQ', 'PS',
  'EG', 'LY', 'TN', 'DZ', 'MA', 'EH', 'SD', 'YE', 'MR', 'SO', 'DJ', 'KM',
];

/** True when the ISO country code belongs to the Arab world. */
export const isArabCountry = (countryCode?: string | null): boolean =>
  ARAB_COUNTRY_CODES.includes(String(countryCode || '').trim().toUpperCase());

/** Normalises any currency string to a supported code (falls back to PKR). */
export const normalizeCurrency = (currency?: string | null): CurrencyCode => {
  const code = String(currency || '').trim().toUpperCase();
  return (code in CURRENCY_META ? code : 'PKR') as CurrencyCode;
};

/**
 * Detected country → currency to display.
 *
 *   '' (not detected yet) → PKR (the store's base / bootstrap currency)
 *   Arab League country   → its local currency
 *   Anything else         → USD
 */
export const resolveCurrencyForCountry = (
  countryCode?: string | null
): CurrencyCode => {
  const code = String(countryCode || '').trim().toUpperCase();

  if (!code) return 'PKR';

  return COUNTRY_CURRENCY[code] ?? 'USD';
};

/** Full metadata for a currency (never throws). */
export const getCurrencyMeta = (currency?: string | null): CurrencyMeta =>
  CURRENCY_META[normalizeCurrency(currency)];

/** Human readable currency name, e.g. `UAE Dirham`. */
export const getCurrencyName = (currency?: string | null): string =>
  getCurrencyMeta(currency).name;

/** Short symbol, e.g. `₨`, `$`, `AED`, `₪`. */
export const getCurrencySymbol = (currency?: string | null): string =>
  getCurrencyMeta(currency).symbol;

/** Minor units, e.g. 2 for AED, 3 for KWD, 0 for DJF. */
export const getCurrencyDecimals = (currency?: string | null): number =>
  getCurrencyMeta(currency).decimals;

/** `AED — UAE Dirham` — used by the header dropdown and checkout labels. */
export const getCurrencyLabel = (currency?: string | null): string => {
  const meta = getCurrencyMeta(currency);
  return `${meta.code} — ${meta.name}`;
};

/**
 * Offline fallback rates: units of each currency for 1 PKR.
 *
 * The live rates from the backend override these at runtime through
 * `setLivePkrRates()`, so these numbers only matter when the exchange-rate API
 * cannot be reached. Keep them roughly in sync with
 * `FALLBACK_RATES` in `server/services/currencyExchange.service.js`.
 */
export const PKR_RATES: Record<string, number> = {
  PKR: 1,
  USD: 1 / USD_TO_PKR_RATE,
  AED: 0.013267,
  SAR: 0.013547,
  QAR: 0.013149,
  KWD: 0.001113,
  BHD: 0.001358,
  OMR: 0.001389,
  EGP: 0.188846,
  JOD: 0.002561,
  IQD: 4.729091,
  LBP: 323.318255,
  YER: 0.853502,
  MAD: 0.035097,
  TND: 0.010762,
  DZD: 0.483385,
  LYD: 0.02308,
  SDG: 1.84278,
  SYP: 0.439865,
  ILS: 0.011121,
  MRU: 0.144243,
  SOS: 2.062312,
  DJF: 0.642016,
  KMF: 1.578506,
};

/**
 * Applies the live PKR-based rates returned by the backend
 * (`location.rates` / `location.exchangeRate`). Unsafe values are ignored.
 */
export const setLivePkrRates = (
  rates?: Record<string, number> | null
): void => {
  if (!rates) return;

  for (const [code, rate] of Object.entries(rates)) {
    const value = Number(rate);
    if (code in CURRENCY_META && !isNaN(value) && value > 0) {
      PKR_RATES[code] = value;
    }
  }
};

/** Units of `currency` for 1 PKR (live rate whenever it is available). */
export const getPkrRate = (currency?: string | null): number => {
  const code = normalizeCurrency(currency);
  const rate = PKR_RATES[code];
  return !isNaN(rate) && rate > 0 ? rate : 1;
};

/** PKR (base) → the display currency, e.g. 1000 PKR → 13.27 AED. */
export const fromPkr = (
  amountPkr: number | string | undefined | null,
  currency?: string | null
): number => {
  const value = Number(amountPkr) || 0;
  const code = normalizeCurrency(currency);

  if (code === 'PKR') return value;

  return value * getPkrRate(code);
};

/** The display currency → PKR (base) — used for amounts we send to the API. */
export const toPkr = (
  amount: number | string | undefined | null,
  currency?: string | null
): number => {
  const value = Number(amount) || 0;
  const code = normalizeCurrency(currency);

  if (code === 'PKR') return value;

  const rate = getPkrRate(code);
  return rate > 0 ? value / rate : value;
};

/**
 * Formats a base (PKR) amount for the given currency.
 *
 *   PKR → `₨1,299.00`
 *   USD → `$4.67`
 *   AED → `AED 13.27`   (Arab currencies use their ISO code + a space)
 *   KWD → `KWD 1.113`   (3 decimals, like ISO 4217 requires)
 *
 * `explicitAmount` is an optional pre-computed amount ALREADY in `currency`
 * (e.g. the per-product USD price set in the admin panel). When it is a
 * positive number it wins over the converted amount.
 */
export const formatAmount = (
  amountInPkr: number | string | undefined | null,
  currency: string = 'PKR',
  explicitAmount?: number | string | null
): string => {
  const code = normalizeCurrency(currency);
  const meta = CURRENCY_META[code];

  const explicit = Number(explicitAmount);
  const hasExplicit =
    explicitAmount !== undefined &&
    explicitAmount !== null &&
    explicitAmount !== '' &&
    !isNaN(explicit) &&
    explicit > 0;

  const display = hasExplicit ? explicit : fromPkr(amountInPkr, code);

  const formatted = display.toLocaleString('en-US', {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  });

  // '₨'/'$'/'₪' hug the number, alphabetic codes (AED, SAR, KWD…) get a space.
  const spacer = /^[A-Za-z]/.test(meta.symbol) ? ' ' : '';

  return `${meta.symbol}${spacer}${formatted}`;
};