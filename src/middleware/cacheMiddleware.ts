import type { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";

import redisClient from "../utilities/redis.js";

export function cache(ttlSeconds: number) {
    return asyncHandler(
        async (
            req: Request,
            res: Response,
            next: NextFunction,
        ): Promise<void> => {
            let key = `cache:${req.originalUrl}`;

            try {
                console.time("request");

                let cachedPromise = redisClient.get(key);

                let cached = await cachedPromise;

                if (cached) {
                    console.timeEnd("request");
                    res.json(JSON.parse(cached));
                    return;
                }

                let originalJson = res.json.bind(res);
                res.json = (body: any) => {
                    if (res.statusCode == 200 || body?.success === true) {
                        redisClient.setex(
                            key,
                            ttlSeconds,
                            JSON.stringify(body),
                        );
                    }
                    console.timeEnd("request");
                    return originalJson(body);
                };

                next();
            } catch (error) {
                console.error("Cache Error: ", error);
                next();
            }
        },
    );
}

export async function invalidateCache(pattern: string) {
    let keys = await redisClient.keys(`cache:*${pattern}*`);
    if (keys.length > 0) {
        await redisClient.del(keys);
    }
}
