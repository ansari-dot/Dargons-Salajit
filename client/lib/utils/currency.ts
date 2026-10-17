/**
 * Storefront currency system.
 *
 * Every price in the database is stored in PKR (the store's BASE currency) and
 * only converted for display:
 *
 *   Pakistan             → PKR (base, no conversion)
 *   Arab League country  → that country's local currency (AED, SAR, QAR, KWD,
 *                          BHD, OMR, JOD, EGP, …) with its proper NAME + symbol
 *   Any other country    → its own local currency (EUR, GBP, INR, JPY, …) —
 *                          USD is only the fallback for the few countries with
 *                          no mapping of their own
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

  // ── Europe ────────────────────────────────────────────────────────────────
  ALL: { code: 'ALL', name: 'Albanian Lek', symbol: 'L', decimals: 2 },
  AMD: { code: 'AMD', name: 'Armenian Dram', symbol: 'AMD', decimals: 2 },
  AZN: { code: 'AZN', name: 'Azerbaijani Manat', symbol: '₼', decimals: 2 },
  BAM: { code: 'BAM', name: 'Bosnia-Herzegovina Convertible Mark', symbol: 'KM', decimals: 2 },
  BGN: { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', decimals: 2 },
  BYN: { code: 'BYN', name: 'Belarusian Ruble', symbol: 'Br', decimals: 2 },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimals: 2 },
  CZK: { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', decimals: 2 },
  DKK: { code: 'DKK', name: 'Danish Krone', symbol: 'kr', decimals: 2 },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2 },
  GBP: { code: 'GBP', name: 'British Pound Sterling', symbol: '£', decimals: 2 },
  GEL: { code: 'GEL', name: 'Georgian Lari', symbol: '₾', decimals: 2 },
  HUF: { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', decimals: 2 },
  ISK: { code: 'ISK', name: 'Icelandic Króna', symbol: 'kr', decimals: 0 },
  KGS: { code: 'KGS', name: 'Kyrgyzstani Som', symbol: 'som', decimals: 2 },
  KZT: { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸', decimals: 2 },
  MDL: { code: 'MDL', name: 'Moldovan Leu', symbol: 'L', decimals: 2 },
  MKD: { code: 'MKD', name: 'Macedonian Denar', symbol: 'MKD', decimals: 2 },
  NOK: { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', decimals: 2 },
  PLN: { code: 'PLN', name: 'Polish Złoty', symbol: 'zł', decimals: 2 },
  RON: { code: 'RON', name: 'Romanian Leu', symbol: 'lei', decimals: 2 },
  RSD: { code: 'RSD', name: 'Serbian Dinar', symbol: 'RSD', decimals: 2 },
  RUB: { code: 'RUB', name: 'Russian Ruble', symbol: '₽', decimals: 2 },
  SEK: { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', decimals: 2 },
  UAH: { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', decimals: 2 },

  // ── Asia ──────────────────────────────────────────────────────────────────
  AFN: { code: 'AFN', name: 'Afghan Afghani', symbol: 'AFN', decimals: 2 },
  BDT: { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', decimals: 2 },
  BND: { code: 'BND', name: 'Brunei Dollar', symbol: 'B$', decimals: 2 },
  BTN: { code: 'BTN', name: 'Bhutanese Ngultrum', symbol: 'Nu.', decimals: 2 },
  CNY: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimals: 2 },
  HKD: { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', decimals: 2 },
  IDR: { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', decimals: 2 },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimals: 2 },
  IRR: { code: 'IRR', name: 'Iranian Rial', symbol: 'IRR', decimals: 2 },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimals: 0 },
  KHR: { code: 'KHR', name: 'Cambodian Riel', symbol: 'KHR', decimals: 2 },
  KRW: { code: 'KRW', name: 'South Korean Won', symbol: '₩', decimals: 0 },
  LAK: { code: 'LAK', name: 'Lao Kip', symbol: 'LAK', decimals: 2 },
  LKR: { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', decimals: 2 },
  MNT: { code: 'MNT', name: 'Mongolian Tugrik', symbol: '₮', decimals: 2 },
  MMK: { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K', decimals: 2 },
  MOP: { code: 'MOP', name: 'Macanese Pataca', symbol: 'MOP$', decimals: 2 },
  MVR: { code: 'MVR', name: 'Maldivian Rufiyaa', symbol: 'Rf', decimals: 2 },
  MYR: { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', decimals: 2 },
  NPR: { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨', decimals: 2 },
  PHP: { code: 'PHP', name: 'Philippine Peso', symbol: '₱', decimals: 2 },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimals: 2 },
  THB: { code: 'THB', name: 'Thai Baht', symbol: '฿', decimals: 2 },
  TJS: { code: 'TJS', name: 'Tajikistani Somoni', symbol: 'TJS', decimals: 2 },
  TMT: { code: 'TMT', name: 'Turkmenistani Manat', symbol: 'TMT', decimals: 2 },
  TRY: { code: 'TRY', name: 'Turkish Lira', symbol: '₺', decimals: 2 },
  TWD: { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$', decimals: 2 },
  UZS: { code: 'UZS', name: 'Uzbekistani Som', symbol: 'UZS', decimals: 2 },
  VND: { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', decimals: 0 },

  // ── Africa (non-Arab) ─────────────────────────────────────────────────────
  AOA: { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz', decimals: 2 },
  BIF: { code: 'BIF', name: 'Burundian Franc', symbol: 'FBu', decimals: 0 },
  BWP: { code: 'BWP', name: 'Botswana Pula', symbol: 'P', decimals: 2 },
  CDF: { code: 'CDF', name: 'Congolese Franc', symbol: 'FC', decimals: 2 },
  CVE: { code: 'CVE', name: 'Cape Verdean Escudo', symbol: 'CVE', decimals: 2 },
  ERN: { code: 'ERN', name: 'Eritrean Nakfa', symbol: 'Nfk', decimals: 2 },
  ETB: { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', decimals: 2 },
  GHS: { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', decimals: 2 },
  GMD: { code: 'GMD', name: 'Gambian Dalasi', symbol: 'D', decimals: 2 },
  GNF: { code: 'GNF', name: 'Guinean Franc', symbol: 'FG', decimals: 0 },
  KES: { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', decimals: 2 },
  LSL: { code: 'LSL', name: 'Lesotho Loti', symbol: 'L', decimals: 2 },
  LRD: { code: 'LRD', name: 'Liberian Dollar', symbol: 'L$', decimals: 2 },
  MGA: { code: 'MGA', name: 'Malagasy Ariary', symbol: 'Ar', decimals: 2 },
  MUR: { code: 'MUR', name: 'Mauritian Rupee', symbol: '₨', decimals: 2 },
  MWK: { code: 'MWK', name: 'Malawian Kwacha', symbol: 'MK', decimals: 2 },
  MZN: { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT', decimals: 2 },
  NAD: { code: 'NAD', name: 'Namibian Dollar', symbol: 'N$', decimals: 2 },
  NGN: { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', decimals: 2 },
  RWF: { code: 'RWF', name: 'Rwandan Franc', symbol: 'FR', decimals: 0 },
  SCR: { code: 'SCR', name: 'Seychellois Rupee', symbol: 'SCR', decimals: 2 },
  SHP: { code: 'SHP', name: 'Saint Helena Pound', symbol: '£', decimals: 2 },
  SLE: { code: 'SLE', name: 'Sierra Leonean Leone', symbol: 'Le', decimals: 2 },
  SSP: { code: 'SSP', name: 'South Sudanese Pound', symbol: '£', decimals: 2 },
  STN: { code: 'STN', name: 'São Tomé and Príncipe Dobra', symbol: 'Db', decimals: 2 },
  SZL: { code: 'SZL', name: 'Swazi Lilangeni', symbol: 'L', decimals: 2 },
  TZS: { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', decimals: 2 },
  UGX: { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', decimals: 0 },
  XAF: { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA', decimals: 0 },
  XOF: { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA', decimals: 0 },
  ZAR: { code: 'ZAR', name: 'South African Rand', symbol: 'R', decimals: 2 },
  ZMW: { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK', decimals: 2 },
  ZWG: { code: 'ZWG', name: 'Zimbabwe Gold', symbol: 'ZWG', decimals: 2 },

  // ── Americas ──────────────────────────────────────────────────────────────
  ARS: { code: 'ARS', name: 'Argentine Peso', symbol: '$', decimals: 2 },
  AWG: { code: 'AWG', name: 'Aruban Florin', symbol: 'ƒ', decimals: 2 },
  BBD: { code: 'BBD', name: 'Barbadian Dollar', symbol: 'Bds$', decimals: 2 },
  BMD: { code: 'BMD', name: 'Bermudian Dollar', symbol: 'BD$', decimals: 2 },
  BOB: { code: 'BOB', name: 'Bolivian Boliviano', symbol: 'Bs', decimals: 2 },
  BRL: { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimals: 2 },
  BSD: { code: 'BSD', name: 'Bahamian Dollar', symbol: 'BS$', decimals: 2 },
  BZD: { code: 'BZD', name: 'Belize Dollar', symbol: 'BZ$', decimals: 2 },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', decimals: 2 },
  CLP: { code: 'CLP', name: 'Chilean Peso', symbol: 'CLP$', decimals: 0 },
  COP: { code: 'COP', name: 'Colombian Peso', symbol: 'COL$', decimals: 2 },
  CRC: { code: 'CRC', name: 'Costa Rican Colón', symbol: '₡', decimals: 2 },
  CUP: { code: 'CUP', name: 'Cuban Peso', symbol: '₱', decimals: 2 },
  DOP: { code: 'DOP', name: 'Dominican Peso', symbol: 'DOP$', decimals: 2 },
  FKP: { code: 'FKP', name: 'Falkland Islands Pound', symbol: 'FK£', decimals: 2 },
  GTQ: { code: 'GTQ', name: 'Guatemalan Quetzal', symbol: 'Q', decimals: 2 },
  GYD: { code: 'GYD', name: 'Guyanese Dollar', symbol: 'GY$', decimals: 2 },
  HTG: { code: 'HTG', name: 'Haitian Gourde', symbol: 'G', decimals: 2 },
  HNL: { code: 'HNL', name: 'Honduran Lempira', symbol: 'L', decimals: 2 },
  JMD: { code: 'JMD', name: 'Jamaican Dollar', symbol: 'J$', decimals: 2 },
  KYD: { code: 'KYD', name: 'Cayman Islands Dollar', symbol: 'CI$', decimals: 2 },
  MXN: { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', decimals: 2 },
  NIO: { code: 'NIO', name: 'Nicaraguan Córdoba', symbol: 'C$', decimals: 2 },
  PAB: { code: 'PAB', name: 'Panamanian Balboa', symbol: 'B/.', decimals: 2 },
  PEN: { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', decimals: 2 },
  PYG: { code: 'PYG', name: 'Paraguayan Guaraní', symbol: '₲', decimals: 0 },
  SRD: { code: 'SRD', name: 'Surinamese Dollar', symbol: 'SR$', decimals: 2 },
  TTD: { code: 'TTD', name: 'Trinidad and Tobago Dollar', symbol: 'TT$', decimals: 2 },
  UYU: { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U', decimals: 2 },
  VES: { code: 'VES', name: 'Venezuelan Bolívar', symbol: 'VES', decimals: 2 },
  XCD: { code: 'XCD', name: 'East Caribbean Dollar', symbol: 'EC$', decimals: 2 },
  XCG: { code: 'XCG', name: 'Caribbean Guilder', symbol: 'XCG', decimals: 2 },

  // ── Oceania ───────────────────────────────────────────────────────────────
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimals: 2 },
  FJD: { code: 'FJD', name: 'Fijian Dollar', symbol: 'FJ$', decimals: 2 },
  NZD: { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', decimals: 2 },
  PGK: { code: 'PGK', name: 'Papua New Guinean Kina', symbol: 'K', decimals: 2 },
  SBD: { code: 'SBD', name: 'Solomon Islands Dollar', symbol: 'SI$', decimals: 2 },
  TOP: { code: 'TOP', name: 'Tongan Paʻanga', symbol: 'T$', decimals: 2 },
  VUV: { code: 'VUV', name: 'Vanuatu Vatu', symbol: 'VT', decimals: 0 },
  WST: { code: 'WST', name: 'Samoan Tala', symbol: 'WS$', decimals: 2 },
  XPF: { code: 'XPF', name: 'CFP Franc', symbol: '₣', decimals: 0 },
};

/** ISO 4217 code of any currency the storefront supports. */
export type CurrencyCode = keyof typeof CURRENCY_META;

/** Priority order used by the currency dropdown in the header. */
const PRIORITY_CURRENCIES: CurrencyCode[] = [
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

/**
 * Every currency the storefront can display, in dropdown order: the priority
 * list first, then all remaining `CURRENCY_META` entries (region by region).
 * Derived from `CURRENCY_META`, so adding a currency only takes one edit.
 */
export const SUPPORTED_CURRENCIES: CurrencyCode[] = [
  ...PRIORITY_CURRENCIES,
  ...(Object.keys(CURRENCY_META) as CurrencyCode[]).filter(
    (code) => !PRIORITY_CURRENCIES.includes(code)
  ),
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

  // ── Europe ────────────────────────────────────────────────────────────────
  AL: 'ALL', AD: 'EUR', AM: 'AMD', AT: 'EUR', AX: 'EUR', AZ: 'AZN',
  BA: 'BAM', BE: 'EUR', BG: 'BGN', BY: 'BYN', CH: 'CHF', CY: 'EUR',
  CZ: 'CZK', DE: 'EUR', DK: 'DKK', EE: 'EUR', ES: 'EUR', FI: 'EUR',
  FO: 'DKK', FR: 'EUR', GB: 'GBP', GG: 'GBP', GI: 'GBP', GR: 'EUR',
  HR: 'EUR', HU: 'HUF', IE: 'EUR', IM: 'GBP', IS: 'ISK', IT: 'EUR',
  JE: 'GBP', LI: 'CHF', LT: 'EUR', LU: 'EUR', LV: 'EUR', MC: 'EUR',
  MD: 'MDL', ME: 'EUR', MK: 'MKD', MT: 'EUR', NL: 'EUR', NO: 'NOK',
  PL: 'PLN', PT: 'EUR', RO: 'RON', RS: 'RSD', RU: 'RUB', SE: 'SEK',
  SI: 'EUR', SK: 'EUR', SJ: 'NOK', SM: 'EUR', TR: 'TRY', UA: 'UAH',
  VA: 'EUR', XK: 'EUR',

  // ── Asia ──────────────────────────────────────────────────────────────────
  AF: 'AFN', BD: 'BDT', BN: 'BND', BT: 'BTN', CC: 'AUD', CN: 'CNY',
  CX: 'AUD', HK: 'HKD', ID: 'IDR', IN: 'INR', IR: 'IRR', JP: 'JPY',
  KG: 'KGS', KH: 'KHR', KR: 'KRW', KZ: 'KZT', LA: 'LAK', LK: 'LKR',
  MM: 'MMK', MN: 'MNT', MO: 'MOP', MV: 'MVR', MY: 'MYR', NP: 'NPR',
  PH: 'PHP', SG: 'SGD', TH: 'THB', TJ: 'TJS', TL: 'USD', TM: 'TMT',
  TW: 'TWD', UZ: 'UZS', VN: 'VND',
  // KP (North Korea / KPW) is intentionally unmapped → falls back to USD.

  // ── Oceania ───────────────────────────────────────────────────────────────
  AS: 'USD', AU: 'AUD', FJ: 'FJD', FM: 'USD', GU: 'USD', KI: 'AUD',
  MH: 'USD', MP: 'USD', NC: 'XPF', NF: 'AUD', NR: 'AUD', NZ: 'NZD',
  PG: 'PGK', PN: 'NZD', PW: 'USD', SB: 'SBD', TO: 'TOP', TV: 'AUD',
  VU: 'VUV', WF: 'XPF', WS: 'WST',

  // ── Africa (non-Arab) ─────────────────────────────────────────────────────
  AO: 'AOA', BF: 'XOF', BI: 'BIF', BJ: 'XOF', BW: 'BWP', CD: 'CDF',
  CF: 'XAF', CG: 'XAF', CI: 'XOF', CM: 'XAF', CV: 'CVE', ER: 'ERN',
  ET: 'ETB', GA: 'XAF', GH: 'GHS', GM: 'GMD', GN: 'GNF', GQ: 'XAF',
  GW: 'XOF', KE: 'KES', LR: 'LRD', LS: 'LSL', MG: 'MGA', ML: 'XOF',
  MU: 'MUR', MW: 'MWK', MZ: 'MZN', NA: 'NAD', NE: 'XOF', NG: 'NGN',
  RE: 'EUR', RW: 'RWF', SC: 'SCR', SH: 'SHP', SL: 'SLE', SN: 'XOF',
  SS: 'SSP', ST: 'STN', SZ: 'SZL', TD: 'XAF', TG: 'XOF', TZ: 'TZS',
  UG: 'UGX', YT: 'EUR', ZA: 'ZAR', ZM: 'ZMW', ZW: 'ZWG',

  // ── Americas ──────────────────────────────────────────────────────────────
  AG: 'XCD', AI: 'XCD', AW: 'AWG', BL: 'EUR', BM: 'BMD', BO: 'BOB',
  BQ: 'USD', BR: 'BRL', BS: 'BSD', BZ: 'BZD', CA: 'CAD', CO: 'COP',
  CR: 'CRC', CU: 'CUP', CW: 'XCG', DM: 'XCD', DO: 'DOP', EC: 'USD',
  FK: 'FKP', GD: 'XCD', GF: 'EUR', GP: 'EUR', GT: 'GTQ', GY: 'GYD',
  HN: 'HNL', HT: 'HTG', JM: 'JMD', KN: 'XCD', KY: 'KYD', LC: 'XCD',
  MF: 'EUR', MQ: 'EUR', MS: 'XCD', MX: 'MXN', NI: 'NIO', PA: 'PAB',
  PE: 'PEN', PM: 'EUR', PR: 'USD', PY: 'PYG', SR: 'SRD', SV: 'USD',
  SX: 'XCG', TC: 'USD', TT: 'TTD', US: 'USD', UY: 'UYU', VC: 'XCD',
  VE: 'VES', VG: 'USD', VI: 'USD',
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
 *   Any other country     → its own local currency (USD only when the country
 *                           has no mapping — see COUNTRY_CURRENCY)
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
 * cannot be reached. Snapshot taken from `open.er-api.com/v6/latest/PKR` and
 * kept in sync with `FALLBACK_RATES` in `server/services/currencyExchange.service.js`.
 */
export const PKR_RATES: Record<string, number> = {
  PKR: 1,
  USD: 1 / USD_TO_PKR_RATE,

  // ── Arab League currencies ────────────────────────────────────────────────
  AED: 0.013261,
  SAR: 0.013541,
  QAR: 0.013144,
  KWD: 0.001118,
  BHD: 0.001358,
  OMR: 0.001388,
  JOD: 0.00256,
  IQD: 5.425077,
  LYD: 0.023218,
  TND: 0.010834,
  EGP: 0.189433,
  LBP: 323.175501,
  SYP: 0.439293,
  YER: 0.852668,
  MAD: 0.035463,
  DZD: 0.485799,
  SDG: 1.656654,
  ILS: 0.011064,
  MRU: 0.144843,
  SOS: 2.064441,
  DJF: 0.641733,
  KMF: 1.585515,

  // ── Europe ────────────────────────────────────────────────────────────────
  ALL: 0.29503,
  AMD: 1.309876,
  AZN: 0.006136,
  BAM: 0.006303,
  BGN: 0.006303,
  BYN: 0.010968,
  CHF: 0.002995,
  CZK: 0.078531,
  DKK: 0.024068,
  EUR: 0.00322,
  GBP: 0.002726,
  GEL: 0.009361,
  HUF: 1.17684,
  ISK: 0.440413,
  KGS: 0.315834,
  KZT: 1.635214,
  MDL: 0.064382,
  MKD: 0.197076,
  NOK: 0.034476,
  PLN: 0.01413,
  RON: 0.017193,
  RSD: 0.377907,
  RUB: 0.306785,
  SEK: 0.036038,
  UAH: 0.162,

  // ── Asia ──────────────────────────────────────────────────────────────────
  AFN: 0.233864,
  BDT: 0.444189,
  BND: 0.004624,
  BTN: 0.349437,
  CNY: 0.024202,
  HKD: 0.028311,
  IDR: 64.572316,
  INR: 0.349127,
  IRR: 6238.938053,
  JPY: 0.570813,
  KHR: 14.641077,
  KRW: 4.839096,
  LAK: 80.43049,
  LKR: 1.192844,
  MNT: 13.058274,
  MMK: 7.574536,
  MOP: 0.029189,
  MVR: 0.05576,
  MYR: 0.014736,
  NPR: 0.559099,
  PHP: 0.22636,
  SGD: 0.00462,
  THB: 0.120963,
  TJS: 0.033192,
  TMT: 0.012604,
  TRY: 0.177834,
  TWD: 0.115191,
  UZS: 42.782184,
  VND: 93.383399,

  // ── Africa (non-Arab) ─────────────────────────────────────────────────────
  AOA: 3.311133,
  BIF: 10.806358,
  BWP: 0.04945,
  CDF: 8.3654,
  CVE: 0.355362,
  ERN: 0.054163,
  ETB: 0.582617,
  GHS: 0.042505,
  GMD: 0.269241,
  GNF: 31.791346,
  KES: 0.468225,
  LSL: 0.059667,
  LRD: 0.617902,
  MGA: 16.344358,
  MUR: 0.171246,
  MWK: 6.252179,
  MZN: 0.230842,
  NAD: 0.059667,
  NGN: 4.797282,
  RWF: 5.325011,
  SCR: 0.052778,
  SHP: 0.002729,
  SLE: 0.088791,
  SSP: 20.735294,
  STN: 0.078959,
  SZL: 0.059667,
  TZS: 9.510989,
  UGX: 14.644511,
  XAF: 2.11402,
  XOF: 2.11402,
  ZAR: 0.059609,
  ZMW: 0.073188,
  ZWG: 0.096366,

  // ── Americas ──────────────────────────────────────────────────────────────
  ARS: 5.473678,
  AWG: 0.006464,
  BBD: 0.007222,
  BMD: 0.003611,
  BOB: 0.04279,
  BRL: 0.018019,
  BSD: 0.003611,
  BZD: 0.007222,
  CAD: 0.005141,
  CLP: 3.531735,
  COP: 11.569118,
  CRC: 1.643943,
  CUP: 0.086662,
  DOP: 0.220825,
  FKP: 0.002729,
  GTQ: 0.027565,
  GYD: 0.754967,
  HTG: 0.472904,
  HNL: 0.096836,
  JMD: 0.572356,
  KYD: 0.003009,
  MXN: 0.066302,
  NIO: 0.132849,
  PAB: 0.003611,
  PEN: 0.012381,
  PYG: 20.809947,
  SRD: 0.136006,
  TTD: 0.024472,
  UYU: 0.144625,
  VES: 3.16603,
  XCD: 0.009749,
  XCG: 0.006464,

  // ── Oceania ───────────────────────────────────────────────────────────────
  AUD: 0.005166,
  FJD: 0.008113,
  NZD: 0.006426,
  PGK: 0.016289,
  SBD: 0.029113,
  TOP: 0.008681,
  VUV: 0.433116,
  WST: 0.010022,
  XPF: 0.384584,
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