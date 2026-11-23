/* Temporary probe: which geo-IP provider works reliably from here? */
const fs = require('fs');
const ip = '39.48.8.227';
const out = [];

const probes = [
  ['ipapi.co', `https://ipapi.co/${ip}/json/`],
  ['ipwho.is', `https://ipwho.is/${ip}`],
  ['ip-api.com', `http://ip-api.com/json/${ip}`],
  ['freeipapi', `https://freeipapi.com/api/json/${ip}`],
];

(async () => {
  for (const [name, url] of probes) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'node' } });
      const text = await res.text();
      out.push(`${name} -> HTTP ${res.status}`);
      out.push('   ' + text.slice(0, 400).replace(/\s+/g, ' '));
    } catch (e) {
      out.push(`${name} -> ERROR ${e.message}`);
    }
  }
  fs.writeFileSync('_verify.txt', out.join('\n'));
})();
