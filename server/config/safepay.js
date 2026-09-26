const safepay = require('@sfpy/node-core')(
  process.env.SAFEPAY_SECRET_KEY,
  {
    authType: 'secret',
    host: process.env.SAFEPAY_HOST || 'https://sandbox.api.getsafepay.com',
  }
);

module.exports = safepay;
