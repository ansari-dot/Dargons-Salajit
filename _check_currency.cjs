/**
 * Consistency check: the client currency tables and the server currency tables
 * must stay in sync (see README). Run: `node _check_currency.cjs`
 */
const fs = require('fs');
const path = require('path');

const clientSrc = fs.readFileSync(
  path.join(__dirname, 'client', 'lib', 'utils', 'currency.ts'),
  'utf8'
);
const serverSrc = fs.readFileSync(
  path.join(__dirname, 'server', 'services', 'currencyExchange.service.js'),
  'utf8'
);

const between = (src, startMarker, endMarker, file) => {
  const s = src.indexOf(startMarker);
  if (s < 0) throw new Error(`${file}: marker not found → ${startMarker}`);
  const e = src.indexOf(endMarker, s + startMarker.length);
  if (e < 0) throw new Error(`${file}: end marker not found → ${endMarker}`);
  return src.slice(s, e + endMarker.length);
};

// ── Client ───────────────────────────────────────────────────────────────────
const metaBlock = between(
  clientSrc,
  'export const CURRENCY_META: Record<string, CurrencyMeta> = {',
  '\n};',
  'currency.ts'
);
const clientMeta = {};
for (const m of metaBlock.matchAll(
  /^  ([A-Z]{3}): \{ code: '([A-Z]{3})', name: '([^']*)', symbol: '([^']*)', decimals: (\d+) \},$/gm
)) {
  clientMeta[m[1]] = { name: m[3], symbol: m[4], decimals: Number(m[5]) };
  if (m[1] !== m[2]) throw new Error(`CURRENCY_META key/code mismatch: ${m[1]} vs ${m[2]}`);
}

const ratesBlock = between(
  clientSrc,
  'export const PKR_RATES: Record<string, number> = {',
  '\n};',
  'currency.ts'
);
const clientRates = [...ratesBlock.matchAll(/^  ([A-Z]{3}): /gm)].map((m) => m[1]);

const countryBlock = between(
  clientSrc,
  'export const COUNTRY_CURRENCY: Record<string, CurrencyCode> = {',
  '\n};',
  'currency.ts'
);
const clientCountry = {};
const clientCountryKeys = [];
for (const m of countryBlock.matchAll(/\b([A-Z]{2}): '([A-Z]{3})'/g)) {
  clientCountryKeys.push(m[1]);
  clientCountry[m[1]] = m[2];
}
const clientCountryValues = [...countryBlock.matchAll(/'([A-Z]{3})'/g)].map((m) => m[1]);

// ── Server ───────────────────────────────────────────────────────────────────
const namesBlock = between(serverSrc, 'const CURRENCY_NAMES = {', '\n};', 'currencyExchange.service.js');
const serverNames = {};
for (const m of namesBlock.matchAll(/^    ([A-Z]{3}): "(.*)",$/gm)) serverNames[m[1]] = m[2];

const fbBlock = between(serverSrc, 'const FALLBACK_RATES = {', '\n};', 'currencyExchange.service.js');
const serverRates = [...fbBlock.matchAll(/^    ([A-Z]{3}): /gm)].map((m) => m[1]);

const mapBlock = between(serverSrc, 'const COUNTRY_CURRENCY_MAP = {', '\n};', 'currencyExchange.service.js');
const serverCountry = {};
const serverCountryKeys = [];
for (const m of mapBlock.matchAll(/\b([A-Z]{2}): "([A-Z]{3})"/g)) {
  serverCountryKeys.push(m[1]);
  serverCountry[m[1]] = m[2];
}
const serverCountryValues = [...mapBlock.matchAll(/"([A-Z]{3})"/g)].map((m) => m[1]);

// ── Compare ──────────────────────────────────────────────────────────────────
const errors = [];
const dupes = (arr) => arr.filter((v, i) => arr.indexOf(v) !== i);
const diff = (a, b) => [...new Set(a)].filter((x) => !new Set(b).has(x));

const metaKeys = Object.keys(clientMeta);
const checkSet = (label, a, b) => {
  const onlyA = diff(a, b);
  const onlyB = diff(b, a);
  if (onlyA.length || onlyB.length) {
    errors.push(`${label}: only in first → [${onlyA}] | only in second → [${onlyB}]`);
  }
};

if (dupes(metaKeys).length) errors.push(`duplicate CURRENCY_META keys: [${dupes(metaKeys)}]`);
if (dupes(clientRates).length) errors.push(`duplicate PKR_RATES keys: [${dupes(clientRates)}]`);
if (dupes(serverRates).length) errors.push(`duplicate FALLBACK_RATES keys: [${dupes(serverRates)}]`);
if (dupes(clientCountryKeys).length) {
  errors.push(`duplicate client country keys: [${dupes(clientCountryKeys)}]`);
}
if (dupes(serverCountryKeys).length) {
  errors.push(`duplicate server country keys: [${dupes(serverCountryKeys)}]`);
}

checkSet('CURRENCY_META vs server CURRENCY_NAMES', metaKeys, Object.keys(serverNames));
checkSet('CURRENCY_META vs PKR_RATES', metaKeys, clientRates);
checkSet('CURRENCY_META vs server FALLBACK_RATES', metaKeys, serverRates);
checkSet('client COUNTRY_CURRENCY vs server COUNTRY_CURRENCY_MAP',
  Object.keys(clientCountry), Object.keys(serverCountry));

for (const [code, meta] of Object.entries(clientMeta)) {
  if (serverNames[code] !== undefined && serverNames[code] !== meta.name) {
    errors.push(`name mismatch for ${code}: client "${meta.name}" vs server "${serverNames[code]}"`);
  }
  if (![0, 2, 3].includes(meta.decimals)) {
    errors.push(`bad decimals for ${code}: ${meta.decimals}`);
  }
}

for (const [cc, code] of Object.entries(clientCountry)) {
  if (!clientMeta[code]) errors.push(`client map ${cc} → ${code} missing from CURRENCY_META`);
  if (serverCountry[cc] !== code) {
    errors.push(`country ${cc}: client → ${code}, server → ${serverCountry[cc]}`);
  }
}
for (const code of clientCountryValues.concat(serverCountryValues)) {
  if (!clientMeta[code]) errors.push(`country map references unknown currency ${code}`);
}

// ── Runtime smoke test (against a compiled copy of the TS module) ────────────
const compiled = path.join(__dirname, '_tmp_currency', 'currency.js');
if (fs.existsSync(compiled)) {
  const cur = require(compiled);
  const samples = [
    ['PKR', 1299, '₨1,299.00'],
    ['USD', 1299, '$4.67'],
    ['EUR', 1299, '€4.18'],
    ['JPY', 1299, '¥741'],
    ['KWD', 1299, 'KWD 1.452'],
    ['DJF', 1299, 'DJF 834'],
  ];
  for (const [code, amount, expected] of samples) {
    const got = cur.formatAmount(amount, code);
    if (got !== expected) errors.push(`formatAmount(${code}) = "${got}", expected "${expected}"`);
  }
  if (cur.SUPPORTED_CURRENCIES.length !== metaKeys.length) {
    errors.push(`SUPPORTED_CURRENCIES has ${cur.SUPPORTED_CURRENCIES.length}, meta has ${metaKeys.length}`);
  }
  for (const cc of ['DE', 'GB', 'IN', 'JP', 'BR', 'ZA', 'AU', 'CA', 'PK', 'SA']) {
    const resolved = cur.resolveCurrencyForCountry(cc);
    if (!cur.CURRENCY_META[resolved]) {
      errors.push(`resolveCurrencyForCountry(${cc}) → ${resolved} unknown`);
    }
  }
} else {
  console.log('(compiled module not found — run tsc first to enable smoke tests)');
}

console.log(`CURRENCY_META currencies : ${metaKeys.length}`);
console.log(`PKR_RATES entries       : ${clientRates.length}`);
console.log(`server CURRENCY_NAMES   : ${Object.keys(serverNames).length}`);
console.log(`server FALLBACK_RATES   : ${serverRates.length}`);
console.log(`country mappings        : ${Object.keys(clientCountry).length}`);

if (errors.length) {
  console.error(`\n${errors.length} ERROR(S):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log('\nAll currency tables are consistent ✔');