const cache = new Map();

const setCache = (key, data, ttl = 30) => {
  const expiry = Date.now() + ttl * 1000;
  cache.set(key, { data, expiry });
};

const getCache = (key) => {
  const cached = cache.get(key);

  if (!cached) return null;

  if (Date.now() > cached.expiry) {
    cache.delete(key);
    return null;
  }

  return cached.data;
};

module.exports = { setCache, getCache };




// First request:
// getCache(key) → null
//    ↓
// fetch from DB
//    ↓
// setCache(key, data)
//    ↓
// return response




// Second request (within 30 sec):
// getCache(key) → data found
//    ↓
// return cached data ⚡

// setCache → saving notes 📒
// getCache → checking notes before asking teacher

// Cache stores data temporarily
// 👉 It avoids hitting DB repeatedly
// 👉 It expires automatically