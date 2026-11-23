const db = require('../config/db');
const exchangeService = require('./currencyExchange.service');

const CALCULATOR_CURRENCIES = [
  { code: 'PKR', name: 'Pakistani Rupee' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'GBP', name: 'British Pound Sterling' },
  { code: 'EUR', name: 'Euro' }
];

const getCalculatorCurrencySettings = async () => {
  const [rows] = await db.query(`
    SELECT currency_code, is_enabled, rate_mode, manual_rate_pkr_per_unit, updated_at
    FROM calculator_currency_settings
    ORDER BY FIELD(currency_code, 'PKR', 'USD', 'GBP', 'EUR')
  `);
  const rowByCode = new Map(rows.map((row) => [row.currency_code, row]));
  const rates = await exchangeService.getExchangeRate();
  const rateMetadata = exchangeService.getExchangeRateMetadata();

  return CALCULATOR_CURRENCIES.map(({ code, name }) => {
    const row = rowByCode.get(code);
    if (!row) {
      throw new Error(`Calculator currency configuration is missing for ${code}.`);
    }

    const isManual = code !== 'PKR' && row.rate_mode === 'manual';
    const automaticRate = code === 'PKR' ? 1 : Number(rates[code]);
    const ratePkrPerUnit = code === 'PKR'
      ? 1
      : isManual
        ? Number(row.manual_rate_pkr_per_unit)
        : automaticRate > 0
          ? 1 / automaticRate
          : 0;

    if (!Number.isFinite(ratePkrPerUnit) || ratePkrPerUnit <= 0) {
      throw new Error(`A valid exchange rate is unavailable for ${code}.`);
    }

    return {
      code,
      name,
      isEnabled: Boolean(row.is_enabled),
      rateMode: code === 'PKR' ? 'base' : isManual ? 'manual' : 'automatic',
      ratePkrPerUnit,
      rateSource: code === 'PKR'
        ? 'base currency'
        : isManual
          ? 'admin override'
          : rateMetadata.source,
      rateUpdatedAt: isManual ? row.updated_at : rateMetadata.updatedAt,
      manualRatePkrPerUnit: row.manual_rate_pkr_per_unit === null
        ? null
        : Number(row.manual_rate_pkr_per_unit)
    };
  });
};

const getCalculatorCurrencyOptions = async () => (
  (await getCalculatorCurrencySettings()).filter((currency) => currency.isEnabled)
);

module.exports = {
  CALCULATOR_CURRENCIES,
  getCalculatorCurrencyOptions,
  getCalculatorCurrencySettings
};
