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

    // ── Europe ──────────────────────────────────────────────────────────────
    AL: "ALL", AD: "EUR", AM: "AMD", AT: "EUR", AX: "EUR", AZ: "AZN",
    BA: "BAM", BE: "EUR", BG: "BGN", BY: "BYN", CH: "CHF", CY: "EUR",
    CZ: "CZK", DE: "EUR", DK: "DKK", EE: "EUR", ES: "EUR", FI: "EUR",
    FO: "DKK", FR: "EUR", GB: "GBP", GG: "GBP", GI: "GBP", GR: "EUR",
    HR: "EUR", HU: "HUF", IE: "EUR", IM: "GBP", IS: "ISK", IT: "EUR",
    JE: "GBP", LI: "CHF", LT: "EUR", LU: "EUR", LV: "EUR", MC: "EUR",
    MD: "MDL", ME: "EUR", MK: "MKD", MT: "EUR", NL: "EUR", NO: "NOK",
    PL: "PLN", PT: "EUR", RO: "RON", RS: "RSD", RU: "RUB", SE: "SEK",
    SI: "EUR", SK: "EUR", SJ: "NOK", SM: "EUR", TR: "TRY", UA: "UAH",
    VA: "EUR", XK: "EUR",

    // ── Asia ────────────────────────────────────────────────────────────────
    AF: "AFN", BD: "BDT", BN: "BND", BT: "BTN", CC: "AUD", CN: "CNY",
    CX: "AUD", HK: "HKD", ID: "IDR", IN: "INR", IR: "IRR", JP: "JPY",
    KG: "KGS", KH: "KHR", KR: "KRW", KZ: "KZT", LA: "LAK", LK: "LKR",
    MM: "MMK", MN: "MNT", MO: "MOP", MV: "MVR", MY: "MYR", NP: "NPR",
    PH: "PHP", SG: "SGD", TH: "THB", TJ: "TJS", TL: "USD", TM: "TMT",
    TW: "TWD", UZ: "UZS", VN: "VND",
    // KP (North Korea / KPW) is intentionally unmapped → falls back to USD.

    // ── Oceania ─────────────────────────────────────────────────────────────
    AS: "USD", AU: "AUD", FJ: "FJD", FM: "USD", GU: "USD", KI: "AUD",
    MH: "USD", MP: "USD", NC: "XPF", NF: "AUD", NR: "AUD", NZ: "NZD",
    PG: "PGK", PN: "NZD", PW: "USD", SB: "SBD", TO: "TOP", TV: "AUD",
    VU: "VUV", WF: "XPF", WS: "WST",

    // ── Africa (non-Arab) ───────────────────────────────────────────────────
    AO: "AOA", BF: "XOF", BI: "BIF", BJ: "XOF", BW: "BWP", CD: "CDF",
    CF: "XAF", CG: "XAF", CI: "XOF", CM: "XAF", CV: "CVE", ER: "ERN",
    ET: "ETB", GA: "XAF", GH: "GHS", GM: "GMD", GN: "GNF", GQ: "XAF",
    GW: "XOF", KE: "KES", LR: "LRD", LS: "LSL", MG: "MGA", ML: "XOF",
    MU: "MUR", MW: "MWK", MZ: "MZN", NA: "NAD", NE: "XOF", NG: "NGN",
    RE: "EUR", RW: "RWF", SC: "SCR", SH: "SHP", SL: "SLE", SN: "XOF",
    SS: "SSP", ST: "STN", SZ: "SZL", TD: "XAF", TG: "XOF", TZ: "TZS",
    UG: "UGX", YT: "EUR", ZA: "ZAR", ZM: "ZMW", ZW: "ZWG",

    // ── Americas ────────────────────────────────────────────────────────────
    AG: "XCD", AI: "XCD", AW: "AWG", BL: "EUR", BM: "BMD", BO: "BOB",
    BQ: "USD", BR: "BRL", BS: "BSD", BZ: "BZD", CA: "CAD", CO: "COP",
    CR: "CRC", CU: "CUP", CW: "XCG", DM: "XCD", DO: "DOP", EC: "USD",
    FK: "FKP", GD: "XCD", GF: "EUR", GP: "EUR", GT: "GTQ", GY: "GYD",
    HN: "HNL", HT: "HTG", JM: "JMD", KN: "XCD", KY: "KYD", LC: "XCD",
    MF: "EUR", MQ: "EUR", MS: "XCD", MX: "MXN", NI: "NIO", PA: "PAB",
    PE: "PEN", PM: "EUR", PR: "USD", PY: "PYG", SR: "SRD", SV: "USD",
    SX: "XCG", TC: "USD", TT: "TTD", US: "USD", UY: "UYU", VC: "XCD",
    VE: "VES", VG: "USD", VI: "USD",
};

const ARAB_COUNTRY_CODES = [
    "AE", "SA", "QA", "KW", "BH", "OM", "JO", "LB", "SY", "IQ", "PS",
    "EG", "LY", "TN", "DZ", "MA", "EH", "SD", "YE", "MR", "SO", "DJ", "KM",
];

const CURRENCY_NAMES = {
    PKR: "Pakistani Rupee",
    USD: "US Dollar",

    // ── Arab League currencies ──────────────────────────────────────────────
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

    // ── Europe ──────────────────────────────────────────────────────────────
    ALL: "Albanian Lek",
    AMD: "Armenian Dram",
    AZN: "Azerbaijani Manat",
    BAM: "Bosnia-Herzegovina Convertible Mark",
    BGN: "Bulgarian Lev",
    BYN: "Belarusian Ruble",
    CHF: "Swiss Franc",
    CZK: "Czech Koruna",
    DKK: "Danish Krone",
    EUR: "Euro",
    GBP: "British Pound Sterling",
    GEL: "Georgian Lari",
    HUF: "Hungarian Forint",
    ISK: "Icelandic Króna",
    KGS: "Kyrgyzstani Som",
    KZT: "Kazakhstani Tenge",
    MDL: "Moldovan Leu",
    MKD: "Macedonian Denar",
    NOK: "Norwegian Krone",
    PLN: "Polish Złoty",
    RON: "Romanian Leu",
    RSD: "Serbian Dinar",
    RUB: "Russian Ruble",
    SEK: "Swedish Krona",
    UAH: "Ukrainian Hryvnia",

    // ── Asia ────────────────────────────────────────────────────────────────
    AFN: "Afghan Afghani",
    BDT: "Bangladeshi Taka",
    BND: "Brunei Dollar",
    BTN: "Bhutanese Ngultrum",
    CNY: "Chinese Yuan",
    HKD: "Hong Kong Dollar",
    IDR: "Indonesian Rupiah",
    INR: "Indian Rupee",
    IRR: "Iranian Rial",
    JPY: "Japanese Yen",
    KHR: "Cambodian Riel",
    KRW: "South Korean Won",
    LAK: "Lao Kip",
    LKR: "Sri Lankan Rupee",
    MNT: "Mongolian Tugrik",
    MMK: "Myanmar Kyat",
    MOP: "Macanese Pataca",
    MVR: "Maldivian Rufiyaa",
    MYR: "Malaysian Ringgit",
    NPR: "Nepalese Rupee",
    PHP: "Philippine Peso",
    SGD: "Singapore Dollar",
    THB: "Thai Baht",
    TJS: "Tajikistani Somoni",
    TMT: "Turkmenistani Manat",
    TRY: "Turkish Lira",
    TWD: "New Taiwan Dollar",
    UZS: "Uzbekistani Som",
    VND: "Vietnamese Dong",

    // ── Africa (non-Arab) ───────────────────────────────────────────────────
    AOA: "Angolan Kwanza",
    BIF: "Burundian Franc",
    BWP: "Botswana Pula",
    CDF: "Congolese Franc",
    CVE: "Cape Verdean Escudo",
    ERN: "Eritrean Nakfa",
    ETB: "Ethiopian Birr",
    GHS: "Ghanaian Cedi",
    GMD: "Gambian Dalasi",
    GNF: "Guinean Franc",
    KES: "Kenyan Shilling",
    LSL: "Lesotho Loti",
    LRD: "Liberian Dollar",
    MGA: "Malagasy Ariary",
    MUR: "Mauritian Rupee",
    MWK: "Malawian Kwacha",
    MZN: "Mozambican Metical",
    NAD: "Namibian Dollar",
    NGN: "Nigerian Naira",
    RWF: "Rwandan Franc",
    SCR: "Seychellois Rupee",
    SHP: "Saint Helena Pound",
    SLE: "Sierra Leonean Leone",
    SSP: "South Sudanese Pound",
    STN: "São Tomé and Príncipe Dobra",
    SZL: "Swazi Lilangeni",
    TZS: "Tanzanian Shilling",
    UGX: "Ugandan Shilling",
    XAF: "Central African CFA Franc",
    XOF: "West African CFA Franc",
    ZAR: "South African Rand",
    ZMW: "Zambian Kwacha",
    ZWG: "Zimbabwe Gold",

    // ── Americas ────────────────────────────────────────────────────────────
    ARS: "Argentine Peso",
    AWG: "Aruban Florin",
    BBD: "Barbadian Dollar",
    BMD: "Bermudian Dollar",
    BOB: "Bolivian Boliviano",
    BRL: "Brazilian Real",
    BSD: "Bahamian Dollar",
    BZD: "Belize Dollar",
    CAD: "Canadian Dollar",
    CLP: "Chilean Peso",
    COP: "Colombian Peso",
    CRC: "Costa Rican Colón",
    CUP: "Cuban Peso",
    DOP: "Dominican Peso",
    FKP: "Falkland Islands Pound",
    GTQ: "Guatemalan Quetzal",
    GYD: "Guyanese Dollar",
    HTG: "Haitian Gourde",
    HNL: "Honduran Lempira",
    JMD: "Jamaican Dollar",
    KYD: "Cayman Islands Dollar",
    MXN: "Mexican Peso",
    NIO: "Nicaraguan Córdoba",
    PAB: "Panamanian Balboa",
    PEN: "Peruvian Sol",
    PYG: "Paraguayan Guaraní",
    SRD: "Surinamese Dollar",
    TTD: "Trinidad and Tobago Dollar",
    UYU: "Uruguayan Peso",
    VES: "Venezuelan Bolívar",
    XCD: "East Caribbean Dollar",
    XCG: "Caribbean Guilder",

    // ── Oceania ─────────────────────────────────────────────────────────────
    AUD: "Australian Dollar",
    FJD: "Fijian Dollar",
    NZD: "New Zealand Dollar",
    PGK: "Papua New Guinean Kina",
    SBD: "Solomon Islands Dollar",
    TOP: "Tongan Paʻanga",
    VUV: "Vanuatu Vatu",
    WST: "Samoan Tala",
    XPF: "CFP Franc",
};

const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_NAMES);

/**
 * Offline fallback rates: units of each currency for 1 PKR.
 * Snapshot taken from `open.er-api.com/v6/latest/PKR` — the live table
 * overrides these at runtime, so they only matter when the API is unreachable.
 * Must stay in sync with `PKR_RATES` in `client/lib/utils/currency.ts`.
 */
const FALLBACK_RATES = {
    PKR: 1,
    USD: 1 / 278,

    // ── Arab League currencies ──────────────────────────────────────────────
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

    // ── Europe ──────────────────────────────────────────────────────────────
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

    // ── Asia ────────────────────────────────────────────────────────────────
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

    // ── Africa (non-Arab) ───────────────────────────────────────────────────
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

    // ── Americas ────────────────────────────────────────────────────────────
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

    // ── Oceania ─────────────────────────────────────────────────────────────
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