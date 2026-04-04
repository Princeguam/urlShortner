import type { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import redisClient from "../utilities/redis.js";
import {
    ErrorType,
    HandleServerError,
    kDefaultIpKey,
    kDefaultUserKey,
    kRateLimitKey,
    kUserEmailStoreKey,
    kUserIdStoreKey,
} from "../constants/index.js";
import { systemResponse } from "../utilities/index.js";

export function rateLimiter(maxRequests: number, windowSeconds: number) {
    return asyncHandler(
        async (
            req: Request,
            res: Response,
            next: NextFunction,
        ): Promise<void> => {
            let ip =
                req.ip ||
                req.socket.remoteAddress ||
                req.headers["x-forwarded-for"] ||
                "unknown";

            let userId = req.store.get(kUserIdStoreKey)
                ? req.store.get(kUserIdStoreKey)
                : undefined;

            let key = userId
                ? `${kRateLimitKey}:${kDefaultUserKey}:${req.originalUrl}:${userId}`
                : `${kRateLimitKey}: ${kDefaultIpKey}:${req.originalUrl}:${ip}:`;

            try {
                let current = await redisClient.incr(key);

                if (current === 1) {
                    await redisClient.expire(key, windowSeconds);
                }

                const ttl = await redisClient.ttl(key);
                res.setHeader("X-RateLimit-Limit", maxRequests);
                res.setHeader(
                    "X-RateLimit-Remaining",
                    Math.max(0, maxRequests - current),
                );
                res.setHeader("X-RateLimit-Reset", ttl);

                if (current > maxRequests) {
                    let { message, errorCode, statusCode } = HandleServerError(
                        ErrorType.RateLimitExceded,
                    );
                    res.status(statusCode).json(
                        systemResponse(false, message, { ip }, errorCode),
                    );
                    return;
                }
                next();
            } catch (error) {
                console.error("Rate Limitter Error: ", error);
                next();
            }
        },
    );
}
