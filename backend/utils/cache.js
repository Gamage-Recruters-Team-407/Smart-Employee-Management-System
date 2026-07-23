class SimpleCache {
  constructor(ttlMs = 300000) { // Default 5 minutes TTL
    this.cache = new Map();
    this.ttlMs = ttlMs;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, customTtl = null) {
    const ttl = customTtl !== null ? customTtl : this.ttlMs;
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
    });
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

export const userCache = new SimpleCache(60000); // 1 minute cache for authenticated user docs
export const employeeCache = new SimpleCache(300000); // 5 minutes cache for employee docs by userId/email

export default SimpleCache;
