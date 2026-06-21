import { Redis } from "ioredis";

export const redisClient = new Redis(
    process.env.REDIS_URL || "redis://localhost:6379",
);

redisClient.on("error", (error) => console.error("Redis Error: ", error));
redisClient.on("connect", () => console.log("Redis Connected"));

// export default redisClient;
