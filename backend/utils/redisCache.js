const { client } = require("../config/redis");

// 🔹 Set cache
const setCache = async (key, data, ttl = 60) => {
  await client.setEx(key, ttl, JSON.stringify(data));
};

// 🔹 Get cache
const getCache = async (key) => {
  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
};

const deleteDriverCache = async (userId) => {
  if (!client.isOpen) return;
  try {
    const keys = await client.keys(`drivers:${userId}:*`);

    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (err) {
    console.error("Cache delete error:", err.message);
  }
};

module.exports = { setCache, getCache, deleteDriverCache };

module.exports = { setCache, getCache,deleteDriverCache };