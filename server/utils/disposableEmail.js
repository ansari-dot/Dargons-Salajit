const fs = require('fs');
const path = require('path');

let DOMAIN_SET = null;

const loadDomains = () => {
  if (DOMAIN_SET) return DOMAIN_SET;
  try {
    const file = path.join(__dirname, '..', 'data', 'disposable_domains.json');
    const list = JSON.parse(fs.readFileSync(file, 'utf8'));
    DOMAIN_SET = new Set(list.map((d) => String(d).toLowerCase().trim()));
  } catch (err) {
    console.warn(`[DisposableEmail] Could not load domain blocklist: ${err.message}`);
    DOMAIN_SET = new Set();
  }
  return DOMAIN_SET;
};

// Extract the domain part of an email, lowercased and trimmed
const extractDomain = (email) => {
  const value = String(email || '').trim().toLowerCase();
  const at = value.lastIndexOf('@');
  if (at === -1) return '';
  return value.slice(at + 1);
};

const isDisposableDomain = (domain) => {
  const set = loadDomains();
  if (!domain || set.size === 0) return false;

  const labels = domain.split('.');
  for (let i = 0; i < labels.length - 1; i++) {
    const candidate = labels.slice(i).join('.');
    if (set.has(candidate)) return true;
  }
  return false;
};


const isDisposableEmail = (email) => isDisposableDomain(extractDomain(email));

module.exports = {
  isDisposableEmail,
  isDisposableDomain,
  extractDomain,
};