// moderation.js — Safety & compliance filters for Talk to Strangers India (Indian context)

// --- 1. Indian 10-digit mobile numbers (start 6-9), with optional separators ---
const PHONE_REGEX = /(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/g;

// --- 2. WhatsApp / Telegram / Instagram / social links & handles ---
const SOCIAL_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?(?:wa\.me|whatsapp\.com|t\.me|telegram\.me|instagram\.com|instagr\.am|snapchat\.com|facebook\.com|fb\.com)\S*/gi,
  /@[a-zA-Z0-9_]{3,30}/g, // @username handles
];

// --- 3. Common URLs (reduce phishing) ---
const URL_REGEX = /(?:https?:\/\/|www\.)\S+/gi;

// --- 4. Profanity / abuse list (English + transliterated Hindi, kept moderate) ---
const PROFANITY = [
  'bc', 'mc', 'madarchod', 'bhenchod', 'chutiya', 'chutia', 'randi', 'randwa',
  'harami', 'kamina', 'kameena', 'bhosdike', 'bsdk', 'lodu', 'laude', 'gandu',
  'gaandu', 'fuck', 'fucking', 'shit', 'bitch', 'bastard', 'asshole', 'slut',
  'whore', 'nude', 'nudes', 'sex', 'sexy', 'horny', 'boobs', 'dick', 'porn',
  'rape', 'rapist', 'cp', 'csam', 'pedo', 'childporn',
];
const PROFANITY_REGEX = new RegExp(
  '\\b(' + PROFANITY.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b',
  'gi'
);

/**
 * Rate limiter: max 2 messages/sec per socket, max 3 identical messages per session.
 */
class MessageRateLimiter {
  constructor() {
    this.timestamps = new Map(); // socketId -> number[]
    this.lastMessages = new Map(); // socketId -> { text, count }
  }

  check(socketId, text) {
    const now = Date.now();
    const window = this.timestamps.get(socketId) || [];
    const recent = window.filter((t) => now - t < 1000);
    if (recent.length >= 2) {
      return { allowed: false, reason: 'rate_limit' };
    }
    recent.push(now);
    this.timestamps.set(socketId, recent);

    const normalized = (text || '').trim().toLowerCase();
    const last = this.lastMessages.get(socketId);
    if (last && last.text === normalized) {
      if (last.count >= 3) {
        return { allowed: false, reason: 'spam_repeat' };
      }
      this.lastMessages.set(socketId, { text: normalized, count: last.count + 1 });
    } else {
      this.lastMessages.set(socketId, { text: normalized, count: 1 });
    }
    return { allowed: true };
  }

  purge(socketId) {
    this.timestamps.delete(socketId);
    this.lastMessages.delete(socketId);
  }
}

/**
 * Build the moderation pipeline. Pass reportDeps = { blocklist } so the server
 * can share the blocklist instance.
 */
function createModeration() {
  const rateLimiter = new MessageRateLimiter();
  const blocklist = new Map(); // ipHash -> expiresAt (ms)

  function isBlocked(ipHash) {
    if (!ipHash) return false;
    const exp = blocklist.get(ipHash);
    if (!exp) return false;
    if (Date.now() > exp) {
      blocklist.delete(ipHash);
      return false;
    }
    return true;
  }

  function block(ipHash, durationMs = 24 * 60 * 60 * 1000) {
    if (ipHash) blocklist.set(ipHash, Date.now() + durationMs);
  }

  /**
   * Returns { ok, clean?, reason? } — detect violations BEFORE broadcast.
   */
  function moderateMessage(socketId, rawText) {
    const text = String(rawText || '');
    if (!text.trim()) return { ok: false, reason: 'empty' };
    if (text.length > 500) return { ok: false, reason: 'too_long' };

    const rate = rateLimiter.check(socketId, text);
    if (!rate.allowed) return { ok: false, reason: rate.reason };

    if (PHONE_REGEX.test(text) || SOCIAL_PATTERNS.some((r) => (r.lastIndex = 0, r.test(text))) || URL_REGEX.test(text)) {
      return { ok: false, reason: 'contact_info_blocked' };
    }

    if (PROFANITY_REGEX.test(text)) {
      return { ok: false, reason: 'profanity_blocked' };
    }
    return { ok: true, clean: text.trim() };
  }

  // Periodic blocklist cleanup (every hour) to respect RAM limits
  const sweeper = setInterval(() => {
    const now = Date.now();
    for (const [k, exp] of blocklist) if (now > exp) blocklist.delete(k);
  }, 60 * 60 * 1000);
  sweeper.unref();

  return { moderateMessage, rateLimiter, isBlocked, block };
}

module.exports = { createModeration };
