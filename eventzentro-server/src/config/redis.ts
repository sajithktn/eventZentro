import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("connect", () => {
  console.log(" Redis connected");
});

redisClient.on("error", (err) => {
  console.error(" Redis Error:", err);
});

export const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (err) {
    console.error("Redis Connection Failed:", err);
    process.exit(1);
  }
};

export default redisClient;