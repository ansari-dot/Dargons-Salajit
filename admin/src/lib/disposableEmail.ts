// Lightweight disposable email domain checker for admin UI
// Mirrors the server-side blocklist in server/data/disposable_domains.json
const DISPOSABLE_DOMAINS = new Set([
  // tempmail domains
  'tempmail.at', 'tempmail.best', 'tempmail.cc', 'tempmail.cn', 'tempmail.co',
  'tempmail.de', 'tempmail.dev', 'tempmail.email', 'tempmail.eu', 'tempmail.id.vn',
  'tempmail.ing', 'tempmail.io', 'tempmail.io.vn', 'tempmail.it', 'tempmail.ninja',
  'tempmail.org', 'tempmail.world', 'tempmail.ws', 'tempmail101.com', 'tempmail2.com',
  'tempmail5.com', 'tempmaildemo.com', 'tempmailer.com', 'tempmailer.de',
  'tempmailer.net', 'tempmailfree.net', 'tempmailo.com', 'tempmailplus.com',
  'tempmailr.com', 'tempmails.net', 'tempmailto.com', 'tempmailyo.org',
  'tempomail.fr', 'tempomail.org', 'besttempmail.com', 'cloudtempmail.net',
  'enitempmail.xyz', 'etempmail.net', 'mytemp.email', 'mytempemail.com',
  'mytempmail.com', 'mytrashmail.com', 'protempmail.com', 'tempinbox.com',
  'temple.email',

  // Common disposable providers
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
  'guerrillamail.biz', 'guerrillamail.de', 'guerrillamail.info', 'guerrillamail.net',
  'guerrillamail.org', 'guerrillamail.biz', 'sharklasers.com', 'grr.la',
  'spam4.me', 'bccto.me', 'chogmail.com', 'spambob.com', 'spambog.com',
  'spambog.de', 'spamgourmet.com', 'spamgourmet.net', 'spamgourmet.org',
  'mailmetrash.com', 'trashmail.com', 'trashmail.net', 'trashmail.org',
  'trashmail.ws', 'trashmail.at', 'trashmail.biz', 'trashmail.de',
  'trashmail.info', 'trashmail.me', 'trashmail.org', 'trashmail.ws',
  'yopmail.com', 'yopmail.net', 'yopmail.org', 'yopmail.fr',
  'ymail.com', 'rocketmail.com', 'dispostable.com', 'temp-mail.org',
  'tempmail.com', 'temp-mail.io', 'tempmail.io', '10minutemail.com',
  '10minutemail.net', '10minutemail.org', 'maildrop.cc', 'maildrop.ml',
  'maildrop.gq', 'maildrop.tk', 'maildrop.cf', 'getairmail.com',
  'airmail.net', 'airmail.org', 'mailcatch.com', 'mailcatch.net',
  'mailcatch.org', 'mailnator.com', 'mailinator.net', 'mailinator.org',
  'mailinator.biz', 'mailinator.info', 'mailinator.us', 'mailinator.vip',
  'mailinator.plus', 'mailinator.ml', 'mailinator.ga', 'mailinator.cf',
  'mailinator.gq', 'mailinator.tk',
]);

export const isDisposableEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  const value = email.trim().toLowerCase();
  const at = value.lastIndexOf('@');
  if (at === -1) return false;
  const domain = value.slice(at + 1);
  
  // Check exact domain and parent domains (e.g., sub.domain.com -> domain.com)
  const labels = domain.split('.');
  for (let i = 0; i < labels.length - 1; i++) {
    const candidate = labels.slice(i).join('.');
    if (DISPOSABLE_DOMAINS.has(candidate)) return true;
  }
  return false;
};