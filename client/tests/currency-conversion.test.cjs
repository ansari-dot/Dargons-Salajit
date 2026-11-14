const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const currencyPath = path.resolve(__dirname, '../lib/utils/currency.ts');
const currencySource = fs.readFileSync(currencyPath, 'utf8');
const compiledCurrency = ts.transpileModule(currencySource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020
  }
}).outputText;
const currencyModule = { exports: {} };
new Function('exports', 'require', 'module', '__filename', '__dirname', compiledCurrency)(
  currencyModule.exports,
  require,
  currencyModule,
  currencyPath,
  path.dirname(currencyPath)
);

const { formatAmount, setLivePkrRates } = currencyModule.exports;

test('formats used, remaining, and total packaging costs in selected currencies', () => {
  setLivePkrRates({ USD: 0.01, GBP: 0.02, EUR: 0.03 });

  const amounts = {
    used: 12000,
    remaining: 28040,
    total: 40040
  };
  const expected = {
    USD: ['$120.00', '$280.40', '$400.40'],
    GBP: ['£240.00', '£560.80', '£800.80'],
    EUR: ['€360.00', '€841.20', '€1,201.20'],
    PKR: ['₨12,000.00', '₨28,040.00', '₨40,040.00']
  };

  for (const [currency, expectedAmounts] of Object.entries(expected)) {
    assert.deepEqual(
      Object.values(amounts).map((amount) => formatAmount(amount, currency)),
      expectedAmounts
    );
  }
});
