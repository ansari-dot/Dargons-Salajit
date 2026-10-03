const EXCHANGE_API = "https://open.er-api.com/v6/latest/PKR";

const BASE_CURRENCY = "PKR";

const FALLBACK_CURRENCY = "USD";


const COUNTRY_CURRENCY_MAP = {
    PK: "PKR",

    // ── Arab League countries ───────────────────────────────────────────────
    AE: "AED", // United Arab Emirates — UAE Dirham
    SA: "SAR", // Saudi Arabia         — Saudi Riyal
    QA: "QAR", // Qatar                — Qatari Riyal
    KW: "KWD", // Kuwait               — Kuwaiti Dinar
    BH: "BHD", // Bahrain              — Bahraini Dinar
    OM: "OMR", // Oman                 — Omani Rial
    JO: "JOD", // Jordan               — Jordanian Dinar
    LB: "LBP", // Lebanon              — Lebanese Pound
    SY: "SYP", // Syria                — Syrian Pound
    IQ: "IQD", // Iraq                 — Iraqi Dinar
    PS: "ILS", // Palestine            — Israeli New Shekel
    EG: "EGP", // Egypt                — Egyptian Pound
    LY: "LYD", // Libya                — Libyan Dinar
    TN: "TND", // Tunisia              — Tunisian Dinar
    DZ: "DZD", // Algeria              — Algerian Dinar
    MA: "MAD", // Morocco              — Moroccan Dirham
    EH: "MAD", // Western Sahara       — Moroccan Dirham
    SD: "SDG", // Sudan                — Sudanese Pound
    YE: "YER", // Yemen                — Yemeni Rial
    MR: "MRU", // Mauritania           — Mauritanian Ouguiya
    SO: "SOS", // Somalia              — Somali Shilling
    DJ: "DJF", // Djibouti             — Djiboutian Franc
    KM: "KMF", // Comoros              — Comorian Franc
};

const ARAB_COUNTRY_CODES = [
    "AE", "SA", "QA", "KW", "BH", "OM", "JO", "LB", "SY", "IQ", "PS",
    "EG", "LY", "TN", "DZ", "MA", "EH", "SD", "YE", "MR", "SO", "DJ", "KM",
];

const CURRENCY_NAMES = {
    PKR: "Pakistani Rupee",
    USD: "US Dollar",
    AED: "UAE Dirham",
    SAR: "Saudi Riyal",
    QAR: "Qatari Riyal",
    KWD: "Kuwaiti Dinar",
    BHD: "Bahraini Dinar",
    OMR: "Omani Rial",
    JOD: "Jordanian Dinar",
    LBP: "Lebanese Pound",
    SYP: "Syrian Pound",
    IQD: "Iraqi Dinar",
    ILS: "Israeli New Shekel",
    EGP: "Egyptian Pound",
    LYD: "Libyan Dinar",
    TND: "Tunisian Dinar",
    DZD: "Algerian Dinar",
    MAD: "Moroccan Dirham",
    SDG: "Sudanese Pound",
    YER: "Yemeni Rial",
    MRU: "Mauritanian Ouguiya",
    SOS: "Somali Shilling",
    DJF: "Djiboutian Franc",
    KMF: "Comorian Franc",
};

const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_NAMES);

const FALLBACK_RATES = {
    PKR: 1,
    USD: 1 / 278,
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
 * Live rate table: `{ [currency]: units per 1 PKR }`.
 * Kept in memory so the (10s) storefront poll does not hammer the API.
 */
let rateCache = {
    rates: null,
    fetchedAt: 0,
};

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const getCurrencyFromCountryCode = (countryCode) => {
    const code = String(countryCode || "").trim().toUpperCase();

    if (!code) {
        return FALLBACK_CURRENCY;
    }

    return COUNTRY_CURRENCY_MAP[code] || FALLBACK_CURRENCY;
};

/** Human readable name, e.g. "UAE Dirham". Falls back to the code itself. */
const getCurrencyName = (currency) => {
    const code = String(currency || "").trim().toUpperCase();
    return CURRENCY_NAMES[code] || code || FALLBACK_CURRENCY;
};

/** True when the ISO country code belongs to the Arab world. */
const isArabCountry = (countryCode) =>
    ARAB_COUNTRY_CODES.includes(String(countryCode || "").trim().toUpperCase());

/** True when the storefront can display this currency. */
const isSupportedCurrency = (currency) =>
    SUPPORTED_CURRENCIES.includes(String(currency || "").trim().toUpperCase());

/** Keeps only the currencies the storefront supports (small payload). */
const pickSupportedRates = (rates) => {
    const picked = {};
    for (const code of SUPPORTED_CURRENCIES) {
        if (rates && typeof rates[code] === "number") {
            picked[code] = rates[code];
        }
    }
    return picked;
};

const getExchangeRate = async () => {
    const now = Date.now();

    if (rateCache.rates && now - rateCache.fetchedAt < CACHE_TTL_MS) {
        return rateCache.rates;
    }

    try {
        const response = await fetch(EXCHANGE_API, {
            cache: "no-store",
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) {
            throw new Error(`Exchange rate HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!data || data.result !== "success" || !data.rates) {
            throw new Error("Exchange rate API returned no rates");
        }

        // The endpoint is PKR based, so the table already means "per 1 PKR".
        rateCache = { rates: data.rates, fetchedAt: now };

        return data.rates;
    } catch (error) {
        console.error("Exchange rate error:", error.message);

        // 1) last good table (even if stale) → 2) built-in fallbacks
        if (rateCache.rates) {
            return rateCache.rates;
        }

        return FALLBACK_RATES;
    }
};

const getRateForCurrency = async (currency) => {
    const code = String(currency || "").trim().toUpperCase();
    const rates = await getExchangeRate();

    if (rates && typeof rates[code] === "number" && rates[code] > 0) {
        return rates[code];
    }

    if (code === BASE_CURRENCY) return 1;

    return FALLBACK_RATES[code] || FALLBACK_RATES[FALLBACK_CURRENCY];
};

const getCurrencyInfo = async (countryCode) => {
    const currency = getCurrencyFromCountryCode(countryCode);
    const rates = await getExchangeRate();

    return {
        baseCurrency: BASE_CURRENCY,
        currency,
        currencyName: getCurrencyName(currency),
        countryCode: String(countryCode || "").trim().toUpperCase(),
        isArabCountry: isArabCountry(countryCode),
        exchangeRate: await getRateForCurrency(currency),
        rates: pickSupportedRates(rates),
    };
};

const convertFromPkr = (amountPkr, rate) => {
    const value = Number(amountPkr);
    const safeRate = Number(rate);

    if (isNaN(value)) return 0;
    if (!safeRate || isNaN(safeRate)) return value;

    return value * safeRate;
};

const convertToPkr = (amount, rate) => {
    const value = Number(amount);
    const safeRate = Number(rate);

    if (isNaN(value)) return 0;
    if (!safeRate || isNaN(safeRate)) return value;

    return value / safeRate;
};

/** Backwards compatible helper kept for existing callers. */
const covertCurrency = (amount, exchangeRate) =>
    convertFromPkr(amount, exchangeRate);

module.exports = {
    BASE_CURRENCY,
    FALLBACK_CURRENCY,
    CURRENCY_NAMES,
    SUPPORTED_CURRENCIES,
    COUNTRY_CURRENCY_MAP,
    ARAB_COUNTRY_CODES,
    getCurrencyFromCountryCode,
    getCurrencyName,
    isArabCountry,
    isSupportedCurrency,
    getExchangeRate,
    getRateForCurrency,
    getCurrencyInfo,
    convertFromPkr,
    convertToPkr,
    covertCurrency,
};