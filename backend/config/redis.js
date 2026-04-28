const { createClient } = require("redis");

const client = createClient({
  username: "default",
  password: "AoVDoM8tEnwQ17ZxFLstosPgYSwGhP8Z", // 👈 your password
  socket: {
    host: "redis-15697.c89.us-east-1-3.ec2.cloud.redislabs.com",
    port: 15697,
  },
});

client.on("error", (err) => console.log("Redis Error:", err));

const connectRedis = async () => {
  await client.connect();
  console.log("🔥 Redis connected");
};

module.exports = { client, connectRedis };